-- No test orders or settings survive this transaction.
begin;
do $test$
declare v_item record; v_result jsonb; v_fee numeric; v_threshold numeric;
begin
  select (value->>'shippingFee')::numeric,coalesce((value->>'freeShippingThreshold')::numeric,5000) into v_fee,v_threshold from public.site_settings where key='commerce';
  if public.store_shipping_fee(899,'2026-10-21 00:00:00+03') <> 0 then raise exception 'campaign_start'; end if;
  if public.store_shipping_fee(899,'2026-10-31 23:59:59.999+03') <> 0 then raise exception 'campaign_last_millisecond'; end if;
  if public.store_shipping_fee(899,'2026-10-20 23:59:59+03') <> v_fee then raise exception 'before_campaign'; end if;
  if public.store_shipping_fee(899,'2026-11-01 00:00:00+03') <> v_fee then raise exception 'campaign_expiry'; end if;
  if public.store_shipping_fee(v_threshold,'2026-11-01 00:00:00+03') <> 0 then raise exception 'normal_threshold'; end if;
  if public.store_shipping_fee(809.1,'2026-10-25 12:00:00+03') <> 0 then raise exception 'discounted_subtotal'; end if;
  select p.slug,v.size,v.color,coalesce(v.price,p.base_price) price into v_item
  from public.products p join public.product_variants v on v.product_id=p.id join public.inventory i on i.variant_id=v.id
  where p.is_active and v.is_active and i.stock-i.reserved>0 and coalesce(v.price,p.base_price) between 1 and 4999 limit 1;
  if v_item.slug is null then raise exception 'fixture_missing'; end if;
  v_result := public.create_store_order(jsonb_build_object(
    'email','shipping-regression@example.invalid','phone','05000000000',
    'shipping',jsonb_build_object('fullName','TEKNİK TEST','city','İstanbul','district','Kadıköy','addressLine','ROLLBACK teknik test'),
    'billing','{}'::jsonb,'items',jsonb_build_array(jsonb_build_object('slug',v_item.slug,'size',v_item.size,'color',v_item.color,'qty',1))));
  if (v_result->>'shippingFee')::numeric <> public.store_shipping_fee(v_item.price) then raise exception 'order_shipping_mismatch'; end if;
  if (v_result->>'grandTotal')::numeric <> v_item.price+public.store_shipping_fee(v_item.price) then raise exception 'order_total_mismatch'; end if;
end;
$test$;
select 'Shipping date boundaries, post-campaign fee, threshold, discounted subtotal and actual order totals: passed; all test changes rolled back' as result;
rollback;
