-- 2026-10-15 / Elmas Triko referral & affiliate accounting
-- Backward-compatible: existing orders are not changed. Payout writes only via guarded RPCs.
begin;

create table if not exists public.influencers (
 id uuid primary key default gen_random_uuid(),
 full_name text not null,
 email text,
 instagram_handle text,
 slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
 code text not null unique check (code ~ '^[A-Z0-9]{3,32}$'),
 status text not null default 'draft' check (status in ('draft','active','paused')),
 user_id uuid unique references auth.users(id) on delete set null,
 discount_percent numeric(5,2) not null default 5 check (discount_percent between 0 and 30),
 commission_percent numeric(5,2) not null default 5 check (commission_percent between 0 and 30),
 vat_percent numeric(5,2) not null default 10 check (vat_percent between 0 and 30),
 gift_product text,
 reels_url text,
 story_url text,
 reels_done boolean not null default false,
 story_done boolean not null default false,
 invite_sent_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index if not exists influencers_email_lower_idx on public.influencers (lower(email)) where email is not null;

create table if not exists public.influencer_orders (
 order_id uuid primary key references public.orders(id) on delete cascade,
 influencer_id uuid not null references public.influencers(id),
 code text not null,
 discount_amount numeric(12,2) not null check (discount_amount >= 0),
 commission_base numeric(12,2) not null check (commission_base >= 0),
 commission_amount numeric(12,2) not null check (commission_amount >= 0),
 created_at timestamptz not null default now()
);
create index if not exists influencer_orders_partner_idx on public.influencer_orders (influencer_id,created_at desc);

alter table public.orders add column if not exists delivered_at timestamptz;
create or replace function public.affiliate_delivery_timestamp()
returns trigger language plpgsql set search_path=public as $fn$
begin
 if new.status = 'delivered' and old.status is distinct from 'delivered' then
   new.delivered_at := coalesce(old.delivered_at,now());
 end if;
 return new;
end;
$fn$;
drop trigger if exists orders_affiliate_delivery_timestamp on public.orders;
create trigger orders_affiliate_delivery_timestamp
before update of status on public.orders
for each row execute function public.affiliate_delivery_timestamp();

create table if not exists public.influencer_payout_requests (
 id uuid primary key default gen_random_uuid(),
 influencer_id uuid not null references public.influencers(id),
 amount numeric(12,2) not null check (amount >= 1000),
 status text not null default 'pending' check (status in ('pending','paid','rejected')),
 requested_at timestamptz not null default now(),
 decided_at timestamptz,
 decided_by uuid references auth.users(id) on delete set null,
 payment_reference text,
 note text
);
create unique index if not exists influencer_single_pending_payout_idx on public.influencer_payout_requests(influencer_id) where status='pending';

create table if not exists public.influencer_clicks (
 id uuid primary key default gen_random_uuid(),
 influencer_id uuid not null references public.influencers(id),
 visitor_hash text not null check (length(visitor_hash) between 32 and 128),
 visit_day date not null default current_date,
 created_at timestamptz not null default now(),
 unique (influencer_id,visitor_hash,visit_day)
);
create index if not exists influencer_clicks_partner_day_idx on public.influencer_clicks(influencer_id,visit_day);

alter table public.influencers enable row level security;
alter table public.influencer_orders enable row level security;
alter table public.influencer_payout_requests enable row level security;
alter table public.influencer_clicks enable row level security;

revoke all on public.influencers,public.influencer_orders,public.influencer_payout_requests,public.influencer_clicks from anon,authenticated;
grant select on public.influencers,public.influencer_orders,public.influencer_payout_requests to authenticated;

create policy influencers_self_read on public.influencers for select to authenticated
 using (user_id=auth.uid() and lower(email)=lower(coalesce(auth.jwt()->>'email','')));
create policy influencer_orders_self_read on public.influencer_orders for select to authenticated
 using (exists(select 1 from public.influencers i where i.id=influencer_id and i.user_id=auth.uid() and lower(i.email)=lower(coalesce(auth.jwt()->>'email',''))));
create policy influencer_requests_self_read on public.influencer_payout_requests for select to authenticated
 using (exists(select 1 from public.influencers i where i.id=influencer_id and i.user_id=auth.uid() and lower(i.email)=lower(coalesce(auth.jwt()->>'email',''))));

create or replace function public.claim_influencer_access()
returns uuid language plpgsql security definer set search_path=public,auth as $fn$
declare v_id uuid; v_user auth.users%rowtype;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 select * into v_user from auth.users where id=auth.uid();
 if v_user.email_confirmed_at is null then raise exception 'email_not_confirmed'; end if;
 select i.id into v_id from public.influencers i
  where i.status='active' and lower(i.email)=lower(v_user.email)
    and (i.user_id is null or i.user_id=auth.uid())
  for update;
 if v_id is null then raise exception 'influencer_not_authorized'; end if;
 update public.influencers set user_id=auth.uid(),updated_at=now() where id=v_id;
 return v_id;
end;
$fn$;
revoke all on function public.claim_influencer_access() from public;
grant execute on function public.claim_influencer_access() to authenticated;

create or replace function public.influencer_request_payout()
returns jsonb language plpgsql security definer set search_path=public,auth as $fn$
declare v_id uuid; v_user auth.users%rowtype; v_earned numeric(12,2); v_taken numeric(12,2); v_available numeric(12,2); v_request uuid;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 select * into v_user from auth.users where id=auth.uid();
 if v_user.email_confirmed_at is null then raise exception 'email_not_confirmed'; end if;
 select id into v_id from public.influencers where user_id=auth.uid() and lower(email)=lower(v_user.email) and status='active' for update;
 if v_id is null then raise exception 'influencer_not_authorized'; end if;
 select coalesce(sum(a.commission_amount),0) into v_earned
 from public.influencer_orders a join public.orders o on o.id=a.order_id
 where a.influencer_id=v_id and o.payment_status='paid' and o.status='delivered'
 and o.delivered_at is not null and o.delivered_at<=now()-interval '14 days';
 select coalesce(sum(amount),0) into v_taken from public.influencer_payout_requests
 where influencer_id=v_id and status in ('pending','paid');
 v_available := round(v_earned-v_taken,2);
 if v_available<1000 then raise exception 'minimum_payout_1000'; end if;
 insert into public.influencer_payout_requests(influencer_id,amount) values(v_id,v_available) returning id into v_request;
 return jsonb_build_object('id',v_request,'amount',v_available,'status','pending');
end;
$fn$;
revoke all on function public.influencer_request_payout() from public;
grant execute on function public.influencer_request_payout() to authenticated;

create or replace function public.influencer_admin_payout(p_request uuid,p_action text,p_reference text default null)
returns void language plpgsql security definer set search_path=public,auth as $fn$
declare v_ok boolean; v_partner uuid; v_amount numeric(12,2); v_earned numeric(12,2); v_paid numeric(12,2);
begin
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin') into v_ok;
 if not v_ok then raise exception 'not_admin'; end if;
 if p_action not in ('paid','rejected') then raise exception 'invalid_action'; end if;
 select influencer_id,amount into v_partner,v_amount from public.influencer_payout_requests where id=p_request and status='pending' for update;
 if v_partner is null then raise exception 'request_not_pending'; end if;
 if p_action='paid' then
   select coalesce(sum(a.commission_amount),0) into v_earned
   from public.influencer_orders a join public.orders o on o.id=a.order_id
   where a.influencer_id=v_partner and o.payment_status='paid' and o.status='delivered'
     and o.delivered_at is not null and o.delivered_at<=now()-interval '14 days';
   select coalesce(sum(amount),0) into v_paid from public.influencer_payout_requests
     where influencer_id=v_partner and status='paid';
   if v_earned-v_paid < v_amount then raise exception 'payout_earnings_reduced_by_refund'; end if;
 end if;
 update public.influencer_payout_requests
 set status=p_action,decided_at=now(),decided_by=auth.uid(),payment_reference=left(nullif(trim(p_reference),''),120)
 where id=p_request and status='pending';
 if not found then raise exception 'request_not_pending'; end if;
end;
$fn$;
revoke all on function public.influencer_admin_payout(uuid,text,text) from public;
grant execute on function public.influencer_admin_payout(uuid,text,text) to authenticated;

insert into public.influencers(full_name,instagram_handle,slug,code,status,gift_product)
values
 ('Sena Nur Karadeniz','nurellaagg1','sena','SENA5','draft','Lacivert/Ekru çizgili hırka M'),
 ('Gizem Aytekin','itsgizemmmmm','gizem','GIZEM5','draft','Ürün seçimi bekleniyor'),
 ('Gamze Sarıoğlu','gmzeoguz','gamze','GAMZE5','draft','Alternatif: Ekose takım (ürün onayı bekleniyor)'),
 ('Fatma Özcan Engindağ',null,'fatma','FATMA5','draft','Lacivert/Ekru hırka M')
on conflict (slug) do nothing;
commit;
