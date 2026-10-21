-- Atomic variant reservations, payment settlement and idempotent legacy reconciliation.
-- Deploy BEFORE reconciling existing paid orders. No historical stock is changed by this migration.
begin;

alter table public.orders add column if not exists stock_reservation_expires_at timestamptz;
create index if not exists orders_stock_expiry_idx on public.orders(stock_reservation_expires_at)
 where payment_status<>'paid' and not is_test and archived_at is null;

create table if not exists public.order_stock_allocations (
  order_item_id uuid primary key references public.order_items(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  state text not null check (state in ('reserved', 'consumed', 'released')),
  was_dispatched boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_stock_allocations_order_idx
  on public.order_stock_allocations(order_id);
alter table public.order_stock_allocations enable row level security;
revoke all on public.order_stock_allocations from public, anon, authenticated;
grant all on public.order_stock_allocations to service_role;
-- Customer writes cannot manufacture allocation entries.

create or replace function public.apply_order_stock(p_order_id uuid, p_action text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  line record;
  allocation record;
  affected integer;
  header public.orders%rowtype;
begin
  select * into header from public.orders where id=p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if header.is_test or header.archived_at is not null then return; end if;
  if p_action in ('reserve','consume') and header.status in ('cancelled','refunded','returned') then raise exception 'order_closed_for_stock'; end if;
  if p_action not in ('reserve', 'consume', 'release') then
    raise exception 'unknown_stock_action';
  end if;

  for line in
    select id, variant_id, quantity from public.order_items
    where order_id = p_order_id order by variant_id, id
  loop
    if line.variant_id is null then
      raise exception 'missing_variant_on_order_item:%', line.id;
    end if;

    select * into allocation from public.order_stock_allocations
    where order_item_id = line.id for update;

    if allocation.order_item_id is not null and (allocation.variant_id<>line.variant_id or allocation.quantity<>line.quantity) then raise exception 'allocated_item_changed'; end if;
    if p_action = 'reserve' then
      if allocation.order_item_id is not null and allocation.state in ('reserved','consumed') then continue; end if;
      update public.inventory set reserved=reserved+line.quantity,updated_at=now()
        where variant_id=line.variant_id and stock-reserved>=line.quantity;
      get diagnostics affected = row_count;
      if affected<>1 then raise exception 'insufficient_stock:%',line.variant_id; end if;
      insert into public.order_stock_allocations(order_item_id,order_id,variant_id,quantity,state)
        values(line.id,p_order_id,line.variant_id,line.quantity,'reserved')
        on conflict(order_item_id) do update set state='reserved',updated_at=now();
    elsif p_action = 'consume' then
      if allocation.order_item_id is not null and allocation.state = 'consumed' then
        continue;
      end if;

      if allocation.order_item_id is not null and allocation.state = 'reserved' then
        update public.inventory
        set stock = stock - line.quantity,
            reserved = reserved - line.quantity,
            updated_at = now()
        where variant_id = line.variant_id and stock >= line.quantity
          and reserved >= line.quantity;
      else
        -- Legacy paid order or a previously released reservation.
        update public.inventory
        set stock = stock - line.quantity, updated_at = now()
        where variant_id = line.variant_id and stock - reserved >= line.quantity;
      end if;
      get diagnostics affected = row_count;
      if affected <> 1 then
        raise exception 'insufficient_stock_on_settlement:%', line.variant_id;
      end if;

      insert into public.order_stock_allocations
        (order_item_id, order_id, variant_id, quantity, state,was_dispatched)
      values (line.id, p_order_id, line.variant_id, line.quantity, 'consumed',header.status in ('shipped','delivered'))
      on conflict (order_item_id) do update
        set state = 'consumed',was_dispatched=order_stock_allocations.was_dispatched or excluded.was_dispatched, updated_at = now();
    else
      if allocation.order_item_id is null or allocation.state = 'released' then
        continue;
      end if;
      if allocation.state='consumed' and allocation.was_dispatched then continue; end if;
      if allocation.state = 'reserved' then
        update public.inventory
        set reserved = reserved - line.quantity, updated_at = now()
        where variant_id = line.variant_id and reserved >= line.quantity;
      else
        -- Restock a paid, unshipped order on cancellation only.
        update public.inventory
        set stock = stock + line.quantity, updated_at = now()
        where variant_id = line.variant_id;
      end if;
      get diagnostics affected = row_count;
      if affected <> 1 then
        raise exception 'inventory_release_failed:%', line.variant_id;
      end if;
      update public.order_stock_allocations
      set state = 'released', updated_at = now()
      where order_item_id = line.id;
    end if;
  end loop;
  if p_action='reserve' and header.payment_status<>'paid' then
    update public.orders set stock_reservation_expires_at=coalesce(stock_reservation_expires_at,now()+interval '30 minutes') where id=p_order_id;
  elsif p_action in ('consume','release') then
    update public.orders set stock_reservation_expires_at=null where id=p_order_id;
  end if;
end;
$$;

create or replace function public.reserve_new_order_item_stock()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare paid boolean;
begin
 select payment_status='paid' into paid from public.orders where id=new.order_id for update;
 if not found then raise exception 'order_missing_for_stock_reservation'; end if;
 perform public.apply_order_stock(new.order_id,case when paid then 'consume' else 'reserve' end);
 return new;
end $$;

drop trigger if exists order_item_stock_reservation on public.order_items;
create trigger order_item_stock_reservation
after insert on public.order_items
for each row execute function public.reserve_new_order_item_stock();

create or replace function public.settle_stock_on_order_update()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if new.is_test or new.archived_at is not null then return new; end if;
  if new.status in ('shipped','delivered') and new.payment_status<>'paid' then raise exception 'payment_required_to_ship'; end if;
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    if new.status in ('cancelled', 'refunded','returned') then
      raise exception 'cannot_pay_cancelled_order';
    end if;
    perform public.apply_order_stock(new.id, 'consume');
  elsif new.status in ('cancelled', 'refunded','returned')
     and old.status is distinct from new.status
     and old.status not in ('shipped', 'delivered') then
    -- A returned, delivered order is NOT automatically added to sellable stock.
    perform public.apply_order_stock(new.id, 'release');
  elsif new.payment_status in ('failed', 'rejected', 'cancelled')
     and old.payment_status is distinct from new.payment_status
     and old.payment_status <> 'paid' then
    perform public.apply_order_stock(new.id, 'release');
  end if;
  if new.status in ('shipped','delivered') then update public.order_stock_allocations set was_dispatched=true where order_id=new.id and state='consumed'; end if;
  return new;
end;
$$;

drop trigger if exists order_payment_stock_settlement on public.orders;
create trigger order_payment_stock_settlement
after update of payment_status, status on public.orders
for each row
when (old.payment_status is distinct from new.payment_status
   or old.status is distinct from new.status)
execute function public.settle_stock_on_order_update();

-- Only privileged server-side use. Both orders settle in one DB transaction.
-- Repeat calls are safe: consumed ledger entries are skipped.
create or replace function public.reconcile_two_paid_orders(p_order_numbers text[])
returns table(order_no text, line_count integer)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  selected_order record;
  unique_count integer;
begin
  select count(distinct n) into unique_count
  from unnest(p_order_numbers) as n;
  if cardinality(p_order_numbers) <> 2 or unique_count <> 2 then
    raise exception 'exactly_two_distinct_order_numbers_required';
  end if;

  if (select count(*) from public.orders
      where orders.order_no = any(p_order_numbers)
        and payment_status = 'paid' and not is_test and archived_at is null
        and status not in ('cancelled', 'refunded')) <> 2 then
    raise exception 'two_confirmed_paid_orders_not_found';
  end if;

  for selected_order in
    select id, orders.order_no from public.orders
    where orders.order_no = any(p_order_numbers)
    order by orders.order_no for update
  loop
    if not exists(select 1 from public.order_items where order_id = selected_order.id) then
      raise exception 'paid_order_has_no_items:%', selected_order.order_no;
    end if;
    perform public.apply_order_stock(selected_order.id, 'consume');
    order_no := selected_order.order_no;
    select count(*) into line_count from public.order_items
      where order_id = selected_order.id;
    return next;
  end loop;
end;
$$;

revoke all on function public.apply_order_stock(uuid, text) from public, anon, authenticated;
revoke all on function public.reserve_new_order_item_stock() from public, anon, authenticated;
revoke all on function public.settle_stock_on_order_update() from public, anon, authenticated;
revoke all on function public.reconcile_two_paid_orders(text[]) from public, anon, authenticated;
grant execute on function public.reconcile_two_paid_orders(text[]) to service_role;

-- Reacquire released/legacy holds before asking the payment provider for a new session.
create or replace function public.ensure_order_stock_reservation(p_order_id uuid,p_ttl_minutes integer default 30)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_ttl_minutes not in (30,1440) then raise exception 'invalid_reservation_duration'; end if;
 perform 1 from public.orders where id=p_order_id for update;
 if exists(select 1 from public.orders where id=p_order_id and payment_status='paid')
   or exists(select 1 from public.payments where order_id=p_order_id and status='paid') then raise exception 'payment_already_received';end if;
 perform public.apply_order_stock(p_order_id,'reserve');
 update public.orders set stock_reservation_expires_at=now()+make_interval(mins=>p_ttl_minutes)
 where id=p_order_id and payment_status<>'paid' and not is_test and archived_at is null;
end $$;
revoke all on function public.ensure_order_stock_reservation(uuid,integer) from public,anon,authenticated;
grant execute on function public.ensure_order_stock_reservation(uuid,integer) to service_role;

-- A minute-level database job releases holds without changing payment truth or cancelling orders.
create or replace function public.release_expired_stock_reservations()
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare expired record; released integer:=0;
begin
 for expired in select id from public.orders
   where stock_reservation_expires_at<=now() and payment_status<>'paid'
     and not is_test and archived_at is null
   order by stock_reservation_expires_at,id limit 100 for update skip locked
 loop
   perform public.apply_order_stock(expired.id,'release');
   released:=released+1;
 end loop;
 return released;
end $$;
revoke all on function public.release_expired_stock_reservations() from public,anon,authenticated;
grant execute on function public.release_expired_stock_reservations() to service_role;

-- Order payment approval and inventory consumption must succeed in the same transaction.
create or replace function public.confirm_order_payment(p_order_id uuid,p_payment_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare header public.orders%rowtype; receipt public.payments%rowtype; newly_paid boolean;
begin
 if coalesce(auth.role(),'')<>'service_role' and not coalesce(public.is_admin(),false) then raise exception 'admin_required'; end if;
 select * into header from public.orders where id=p_order_id for update;
 if not found then raise exception 'order_not_found'; end if;
 select * into receipt from public.payments where id=p_payment_id and order_id=p_order_id for update;
 if not found then raise exception 'payment_not_found'; end if;
 if header.archived_at is not null or header.status in ('cancelled','refunded','returned') then raise exception 'order_closed_for_payment'; end if;
 if abs(receipt.amount-header.grand_total)>0.01 then raise exception 'payment_amount_mismatch'; end if;
 newly_paid:=header.payment_status<>'paid';
 if newly_paid then
   update public.orders set payment_provider=receipt.provider,payment_status='paid',status='paid',updated_at=now() where id=p_order_id;
 end if;
 update public.payments set status='paid',updated_at=now() where id=p_payment_id;
 return newly_paid;
end $$;
revoke all on function public.confirm_order_payment(uuid,uuid) from public,anon,authenticated;
grant execute on function public.confirm_order_payment(uuid,uuid) to service_role,authenticated;

create or replace function public.guard_allocated_order_item()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if exists(select 1 from public.order_stock_allocations where order_item_id=old.id and state in ('reserved','consumed')) then
   if TG_OP='DELETE' then raise exception 'allocated_order_item_cannot_be_deleted'; end if;
   if new.variant_id is distinct from old.variant_id or new.quantity<>old.quantity or new.order_id<>old.order_id then raise exception 'allocated_order_item_cannot_be_changed'; end if;
 end if;
 if TG_OP='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function public.guard_allocated_order_item() from public,anon,authenticated;
drop trigger if exists guard_allocated_order_item on public.order_items;
create trigger guard_allocated_order_item before update or delete on public.order_items for each row execute function public.guard_allocated_order_item();

-- Reserved quantities belong to checkout allocations, never to an editable stock form.
alter table public.inventory add constraint inventory_stock_covers_reservations check (stock>=reserved);
create or replace function public.update_inventory_stock(p_variant_id uuid,p_stock integer)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not coalesce(public.is_admin(),false) then raise exception 'admin_required'; end if;
 if p_stock<0 then raise exception 'invalid_stock'; end if;
 insert into public.inventory(variant_id,stock) values(p_variant_id,p_stock)
 on conflict(variant_id) do update set stock=excluded.stock,updated_at=now();
end $$;
revoke all on function public.update_inventory_stock(uuid,integer) from public,anon,authenticated;
grant execute on function public.update_inventory_stock(uuid,integer) to authenticated;

-- Acquire inventory locks in a consistent variant order in every multi-item checkout.
do $patch$
declare definition text; needle text:='  for v_item in select * from jsonb_array_elements(payload->''items'')';
begin
 definition:=pg_get_functiondef('public.create_store_order(jsonb)'::regprocedure);
 if position(needle in definition)=0 then raise exception 'order_rpc_lock_order_anchor_missing'; end if;
 definition:=replace(definition,needle,$replacement$  for v_item in
    select e.value from jsonb_array_elements(payload->'items') e(value)
    order by (select v.id from public.products p join public.product_variants v on v.product_id=p.id
      where p.slug=e.value->>'slug' and p.is_active and v.is_active
      and (nullif(e.value->>'size','') is null or v.size=e.value->>'size')
      and (nullif(e.value->>'color','') is null or v.color=e.value->>'color')
      order by v.created_at,v.id limit 1)$replacement$);
 definition:=replace(definition,'order by created_at asc','order by created_at asc,id');
 execute definition;
end $patch$;
notify pgrst,'reload schema';

commit;
