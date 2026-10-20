-- Shipping is priced in the database, independent of browser totals or clock.
begin;
create or replace function public.store_shipping_fee(p_subtotal numeric, p_at timestamptz default now())
returns numeric language plpgsql stable set search_path = public as $fee$
declare
  v_settings jsonb;
  v_threshold numeric;
  v_fee numeric;
begin
  if p_at >= timestamptz '2026-10-21 00:00:00+03'
     and p_at < timestamptz '2026-11-01 00:00:00+03' then
    return 0;
  end if;
  select value into v_settings from public.site_settings where key='commerce';
  v_threshold := coalesce(nullif(v_settings->>'freeShippingThreshold','')::numeric,5000);
  if p_subtotal >= v_threshold then return 0; end if;
  v_fee := nullif(v_settings->>'shippingFee','')::numeric;
  if v_fee is null or v_fee < 0 then raise exception 'shipping_fee_not_configured'; end if;
  return v_fee;
end;
$fee$;
revoke all on function public.store_shipping_fee(numeric,timestamptz) from public;
grant execute on function public.store_shipping_fee(numeric,timestamptz) to anon,authenticated,service_role;

create or replace function public.create_store_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_no text := 'ET-' || to_char(clock_timestamp(), 'YYYYMMDD-HH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
  v_user_id uuid := auth.uid();
  v_email text := lower(trim(coalesce(payload->>'email', '')));
  v_phone text := nullif(trim(coalesce(payload->>'phone', '')), '');
  v_shipping jsonb := payload->'shipping';
  v_billing jsonb := payload->'billing';
  v_item jsonb;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_unit_price numeric(12,2);
  v_qty integer;
  v_subtotal numeric(12,2) := 0;
  v_shipping_fee numeric(12,2) := 0;
  v_shipping_fee_config numeric(12,2);
  v_available integer;
  v_grand_total numeric(12,2) := 0;
  v_affiliate public.influencers%rowtype;
  v_affiliate_code text := upper(trim(coalesce(payload->>'affiliateCode','')));
  v_discount numeric(12,2) := 0;
begin
  if v_email = '' or position('@' in v_email) = 0 then
    raise exception 'invalid_email';
  end if;

  if jsonb_typeof(payload->'items') <> 'array' or jsonb_array_length(payload->'items') = 0 then
    raise exception 'empty_cart';
  end if;

  if trim(coalesce(v_shipping->>'fullName', '')) = ''
     or trim(coalesce(v_shipping->>'city', '')) = ''
     or trim(coalesce(v_shipping->>'district', '')) = ''
     or trim(coalesce(v_shipping->>'addressLine', '')) = '' then
    raise exception 'invalid_shipping_address';
  end if;

  for v_item in select * from jsonb_array_elements(payload->'items')
  loop
    v_qty := greatest(1, least(99, coalesce((v_item->>'qty')::integer, 1)));

    select *
      into v_product
      from public.products
     where slug = v_item->>'slug'
       and is_active = true
     limit 1;

    if v_product.id is null then
      raise exception 'product_not_found:%', v_item->>'slug';
    end if;

    select *
      into v_variant
      from public.product_variants
     where product_id = v_product.id
       and is_active = true
       and (nullif(v_item->>'size', '') is null or size = v_item->>'size')
       and (nullif(v_item->>'color', '') is null or color = v_item->>'color')
     order by created_at asc
     limit 1;

    if v_variant.id is null then
      raise exception 'variant_not_found:%', v_product.slug;
    end if;

    select greatest(stock - reserved, 0) into v_available
      from public.inventory
     where variant_id = v_variant.id;

    if v_available is null or v_available < v_qty then
      raise exception 'insufficient_stock:%', v_product.slug;
    end if;

    v_unit_price := coalesce(v_variant.price, v_product.base_price);

    if v_unit_price is null then
      raise exception 'price_missing:%', v_product.slug;
    end if;

    v_subtotal := v_subtotal + (v_unit_price * v_qty);
  end loop;

  -- Validate and price the promotion inside the trusted database transaction.
  -- This is the only source of truth for the customer's discount and attribution.
  if v_affiliate_code <> '' then
    select * into v_affiliate from public.influencers
    where code=v_affiliate_code and status='active' and email is not null
    limit 1;
    if v_affiliate.id is null then
      raise exception 'invalid_affiliate_code';
    end if;
    v_discount := round(v_subtotal * v_affiliate.discount_percent / 100, 2);
  end if;

  v_shipping_fee := public.store_shipping_fee(v_subtotal - v_discount);

  v_grand_total := v_subtotal - v_discount + v_shipping_fee;

  insert into public.orders (
    id, order_no, user_id, guest_email, guest_phone, status,
    subtotal, shipping_fee, discount_total, grand_total, currency,
    payment_provider, payment_status
  ) values (
    v_order_id, v_order_no, v_user_id, v_email, v_phone, 'awaiting_payment',
    v_subtotal, v_shipping_fee, v_discount, v_grand_total, 'TRY',
    null, 'pending'
  );

  for v_item in select * from jsonb_array_elements(payload->'items')
  loop
    v_qty := greatest(1, least(99, coalesce((v_item->>'qty')::integer, 1)));

    select *
      into v_product
      from public.products
     where slug = v_item->>'slug'
       and is_active = true
     limit 1;

    select *
      into v_variant
      from public.product_variants
     where product_id = v_product.id
       and is_active = true
       and (nullif(v_item->>'size', '') is null or size = v_item->>'size')
       and (nullif(v_item->>'color', '') is null or color = v_item->>'color')
     order by created_at asc
     limit 1;

    v_unit_price := coalesce(v_variant.price, v_product.base_price);

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, sku, color, size,
      unit_price, quantity, line_total
    ) values (
      v_order_id,
      v_product.id,
      v_variant.id,
      v_product.name,
      v_variant.sku,
      coalesce(v_item->>'color', v_variant.color),
      coalesce(v_item->>'size', v_variant.size),
      v_unit_price,
      v_qty,
      v_unit_price * v_qty
    );
  end loop;

  if v_affiliate.id is not null then
    insert into public.influencer_orders
      (order_id,influencer_id,code,discount_amount,commission_base,commission_amount)
    values (
      v_order_id,
      v_affiliate.id,
      v_affiliate_code,
      v_discount,
      round((v_subtotal-v_discount)/(1+v_affiliate.vat_percent/100),2),
      round(((v_subtotal-v_discount)/(1+v_affiliate.vat_percent/100))*v_affiliate.commission_percent/100,2)
    );
  end if;

  insert into public.order_addresses (
    order_id, kind, full_name, phone, city, district, postal_code, address_line
  ) values (
    v_order_id,
    'shipping',
    trim(v_shipping->>'fullName'),
    v_phone,
    trim(v_shipping->>'city'),
    trim(v_shipping->>'district'),
    nullif(trim(coalesce(v_shipping->>'postalCode', '')), ''),
    trim(v_shipping->>'addressLine')
  );

  insert into public.order_addresses (
    order_id, kind, full_name, company_name, tax_office, tax_number,
    phone, city, district, postal_code, address_line
  ) values (
    v_order_id,
    'billing',
    coalesce(nullif(trim(v_billing->>'fullName'), ''), trim(v_shipping->>'fullName')),
    nullif(trim(coalesce(v_billing->>'companyName', '')), ''),
    nullif(trim(coalesce(v_billing->>'taxOffice', '')), ''),
    nullif(trim(coalesce(v_billing->>'taxNumber', '')), ''),
    v_phone,
    coalesce(nullif(trim(v_billing->>'city'), ''), trim(v_shipping->>'city')),
    coalesce(nullif(trim(v_billing->>'district'), ''), trim(v_shipping->>'district')),
    coalesce(nullif(trim(v_billing->>'postalCode'), ''), nullif(trim(coalesce(v_shipping->>'postalCode', '')), '')),
    coalesce(nullif(trim(v_billing->>'addressLine'), ''), trim(v_shipping->>'addressLine'))
  );

  return jsonb_build_object(
    'orderId', v_order_id,
    'orderNo', v_order_no,
    'subtotal', v_subtotal,
    'shippingFee', v_shipping_fee,
    'discountTotal', v_discount,
    'affiliateCode', nullif(v_affiliate_code,''),
    'grandTotal', v_grand_total,
    'currency', 'TRY',
    'status', 'awaiting_payment'
  );
end;
$$;
revoke all on function public.create_store_order(jsonb) from public;
grant execute on function public.create_store_order(jsonb) to anon, authenticated;
commit;
