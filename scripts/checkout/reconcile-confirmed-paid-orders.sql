-- User-confirmed real orders only. Safe to repeat; stock ledger prevents a second deduction.
-- The older order lost its variant link during catalogue replacement; relink only the exact
-- unique product / colour / size / historical price match verified in the stock audit.
begin;
do $reconcile$
declare before_state jsonb; after_state jsonb; old_consumed integer;
begin
 perform 1 from public.orders where id in ('580c5815-219a-4275-bdf4-fc4cd904fb2a','17e4d636-a68e-4118-91bf-0f08a2f8b17f') order by id for update;
 if (select count(*) from public.orders where
   (id='580c5815-219a-4275-bdf4-fc4cd904fb2a' and order_no='ET-20261010-145149-B7374' and status='delivered') or
   (id='17e4d636-a68e-4118-91bf-0f08a2f8b17f' and order_no='ET-20261020-145940-6CF98' and status='shipped'))<>2 then raise exception 'Historical order identity/status changed; review required';end if;
 select count(*) into old_consumed from public.order_stock_allocations where order_id in ('580c5815-219a-4275-bdf4-fc4cd904fb2a','17e4d636-a68e-4118-91bf-0f08a2f8b17f') and state='consumed';
 select jsonb_agg(jsonb_build_object('order_no',o.order_no,'item_id',i.id,'product_id',i.product_id,'variant_id',i.variant_id,'quantity',i.quantity,'inventory_stock',inv.stock,'inventory_reserved',inv.reserved)) into before_state
 from public.orders o join public.order_items i on i.order_id=o.id left join public.inventory inv on inv.variant_id=i.variant_id
 where o.id in ('580c5815-219a-4275-bdf4-fc4cd904fb2a','17e4d636-a68e-4118-91bf-0f08a2f8b17f');
 if not exists(select 1 from public.order_items i join public.product_variants v on v.id='465c2943-5bde-4a58-a4ca-0eda0fcab2ce' join public.products p on p.id=v.product_id
   where i.id='c06bd191-8c93-4fb5-b87e-7c043afef288' and i.order_id='580c5815-219a-4275-bdf4-fc4cd904fb2a'
   and i.quantity=1 and i.color='Ekru' and i.size='S' and i.unit_price=899
   and v.product_id='994a9d16-8f16-4abe-ac24-25e7bf838e72' and v.color=i.color and v.size=i.size
   and coalesce(v.price,p.base_price)=i.unit_price
   and regexp_replace(lower(i.product_name),'\s+','','g')=regexp_replace(lower(p.name),'\s+','','g')
   and (i.variant_id is null or i.variant_id=v.id) and (i.product_id is null or i.product_id=p.id)) then raise exception 'Legacy variant match changed; review required';end if;
 if not exists(select 1 from public.order_items where id='07063883-5902-4a49-98fe-4c40e3361274' and order_id='17e4d636-a68e-4118-91bf-0f08a2f8b17f'
   and variant_id='03ed1f07-01de-45b9-9d74-da5f049083c4' and quantity=1 and color='Lacivert' and size='S' and unit_price=799) then raise exception 'Second order variant changed';end if;
 update public.order_items set product_id='994a9d16-8f16-4abe-ac24-25e7bf838e72',variant_id='465c2943-5bde-4a58-a4ca-0eda0fcab2ce'
 where id='c06bd191-8c93-4fb5-b87e-7c043afef288' and variant_id is null and product_id is null;
 perform public.reconcile_two_paid_orders(array['ET-20261010-145149-B7374','ET-20261020-145940-6CF98']);
 select jsonb_agg(jsonb_build_object('order_no',o.order_no,'item_id',i.id,'variant_id',i.variant_id,'quantity',i.quantity,'stock',inv.stock,'reserved',inv.reserved,'allocation',a.state)) into after_state
 from public.orders o join public.order_items i on i.order_id=o.id join public.inventory inv on inv.variant_id=i.variant_id join public.order_stock_allocations a on a.order_item_id=i.id
 where o.id in ('580c5815-219a-4275-bdf4-fc4cd904fb2a','17e4d636-a68e-4118-91bf-0f08a2f8b17f');
 if old_consumed<2 then insert into public.audit_logs(action,entity_type,metadata) values('reconcile_paid_stock','stock_reconciliation',jsonb_build_object('before',before_state,'after',after_state,'reason','User confirmed two genuine historical paid orders; exact legacy variant relink'));end if;
end $reconcile$;
commit;
select o.order_no,o.status,o.payment_status,i.color,i.size,i.quantity,inv.stock,inv.reserved,a.state from public.orders o
 join public.order_items i on i.order_id=o.id join public.inventory inv on inv.variant_id=i.variant_id join public.order_stock_allocations a on a.order_item_id=i.id
 where o.id in ('580c5815-219a-4275-bdf4-fc4cd904fb2a','17e4d636-a68e-4118-91bf-0f08a2f8b17f') order by o.order_no;
