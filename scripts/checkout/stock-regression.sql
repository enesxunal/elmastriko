-- Self-contained rollback-only regression. Requires atomic stock migration.
begin;
do $test$
declare pid uuid:=gen_random_uuid(); va uuid:=gen_random_uuid(); vb uuid:=gen_random_uuid();
 oa uuid:=gen_random_uuid(); ob uuid:=gen_random_uuid(); oc uuid:=gen_random_uuid(); ot uuid:=gen_random_uuid();
 item_id uuid; pay_id uuid; result jsonb; message text; baseline integer; exp timestamptz;
begin
 insert into public.products(id,slug,name,base_price,is_active) values(pid,'stock-regression-'||pid,'Stock regression',100,true);
 insert into public.product_variants(id,product_id,color,size,price) values(va,pid,'Ekru','S',100),(vb,pid,'Ekru','M',100);
 insert into public.inventory(variant_id,stock) values(va,1),(vb,0);
 insert into public.orders(id,order_no,guest_email,grand_total) values(oa,'STOCK-A-'||oa,'stock-regression@local.test',100),(ob,'STOCK-B-'||ob,'stock-regression@local.test',100),(oc,'STOCK-C-'||oc,'stock-regression@local.test',100);
 insert into public.order_items(order_id,product_id,variant_id,product_name,color,size,unit_price,quantity,line_total)
 values(oa,pid,va,'Stock regression','Ekru','S',100,1,100) returning id into item_id;
 if (select reserved from public.inventory where variant_id=va)<>1 then raise exception 'Reservation missing'; end if;
 select stock_reservation_expires_at into exp from public.orders where id=oa;
 if exp<now()+interval '29 minutes' or exp>now()+interval '31 minutes' then raise exception 'Card default expiry wrong'; end if;
 begin
  insert into public.order_items(order_id,variant_id,product_name,unit_price,quantity,line_total) values(ob,va,'Second buyer',100,1,100);
  raise exception 'Second buyer oversold';
 exception when raise_exception then get stacked diagnostics message=MESSAGE_TEXT; if message not like 'insufficient_stock:%' then raise; end if; end;
 begin update public.order_items set quantity=2 where id=item_id;raise exception 'Allocated item edit allowed';
 exception when raise_exception then get stacked diagnostics message=MESSAGE_TEXT; if message<>'allocated_order_item_cannot_be_changed' then raise; end if;end;
 begin
  insert into public.order_items(order_id,variant_id,product_name,unit_price,quantity,line_total) values(oa,va,'Duplicate line',100,1,100);
  raise exception 'Duplicate line oversold';
 exception when raise_exception then get stacked diagnostics message=MESSAGE_TEXT; if message not like 'insufficient_stock:%' then raise; end if;end;
 perform public.ensure_order_stock_reservation(oa,1440);
 select stock_reservation_expires_at into exp from public.orders where id=oa;
 if exp<now()+interval '23 hours 59 minutes' or exp>now()+interval '24 hours 1 minute' then raise exception 'Bank expiry wrong';end if;
 update public.orders set stock_reservation_expires_at=now()-interval '1 second' where id=oa;
 baseline:=public.release_expired_stock_reservations();
 if baseline<>1 or (select reserved from public.inventory where variant_id=va)<>0 then raise exception 'Expiry release failed';end if;
 if public.release_expired_stock_reservations()<>0 then raise exception 'Expiry repeated';end if;
 -- Late approval cannot consume a unit now held for someone else. Both order and receipt stay unapproved.
 insert into public.order_items(order_id,variant_id,product_name,unit_price,quantity,line_total) values(ob,va,'Second buyer',100,1,100);
 insert into public.payments(order_id,provider,amount,status) values(oa,'bank_transfer',100,'pending') returning id into pay_id;
 perform set_config('request.jwt.claim.role','service_role',true);
 begin perform public.confirm_order_payment(oa,pay_id); raise exception 'Expired approval oversold';
 exception when raise_exception then get stacked diagnostics message=MESSAGE_TEXT; if message not like 'insufficient_stock_on_settlement:%' then raise; end if;end;
 if (select status from public.payments where id=pay_id)<>'pending' or (select payment_status from public.orders where id=oa)='paid' then raise exception 'Failed approval leaked paid state';end if;
 update public.orders set status='cancelled' where id=ob;
 perform public.ensure_order_stock_reservation(oa,30);
 if not public.confirm_order_payment(oa,pay_id) then raise exception 'First approval not reported';end if;
 if public.confirm_order_payment(oa,pay_id) then raise exception 'Repeated approval reported new';end if;
 if (select stock from public.inventory where variant_id=va)<>0 or (select reserved from public.inventory where variant_id=va)<>0 then raise exception 'Consumption not exactly once';end if;
 update public.orders set status='cancelled' where id=oa;
 update public.orders set status='refunded' where id=oa;
 if (select stock from public.inventory where variant_id=va)<>1 then raise exception 'Unshipped restock incorrect';end if;
 -- Multi-line checkout rolls back the entire order when one line cannot reserve.
 begin
  result:=public.create_store_order(jsonb_build_object('email','stock-regression@local.test','shipping',jsonb_build_object('fullName','Stock regression','city','Istanbul','district','Test','addressLine','Test'),
   'items',jsonb_build_array(jsonb_build_object('slug','stock-regression-'||pid,'color','Ekru','size','S','qty',1),jsonb_build_object('slug','stock-regression-'||pid,'color','Ekru','size','M','qty',1))));
  raise exception 'Multi-line shortage accepted';
 exception when raise_exception then get stacked diagnostics message=MESSAGE_TEXT; if message not like 'insufficient_stock:%' then raise; end if;end;
 if (select reserved from public.inventory where variant_id=va)<>0 then raise exception 'Multi-line leaked reservation';end if;
 begin
  insert into public.order_items(order_id,variant_id,product_name,unit_price,quantity,line_total)
  values(oc,va,'Batch first',100,1,100),(oc,vb,'Batch shortage',100,1,100);
  raise exception 'Partial batch accepted';
 exception when raise_exception then get stacked diagnostics message=MESSAGE_TEXT;if message not like 'insufficient_stock:%' then raise;end if;end;
 if (select reserved from public.inventory where variant_id=va)<>0 or exists(select 1 from public.order_items where order_id=oc) then raise exception 'Batch left partial stock hold';end if;
 insert into public.order_items(order_id,variant_id,product_name,unit_price,quantity,line_total) values(oc,va,'Shipped item',100,1,100);
 update public.orders set payment_status='failed' where id=oc;
 if (select reserved from public.inventory where variant_id=va)<>0 then raise exception 'Failed payment did not release hold';end if;
 perform public.ensure_order_stock_reservation(oc,30);
 if (select reserved from public.inventory where variant_id=va)<>1 then raise exception 'Payment retry did not reacquire hold';end if;
 update public.orders set payment_status='paid',status='paid' where id=oc;
 update public.orders set status='shipped' where id=oc;
 update public.orders set status='cancelled' where id=oc;
 update public.orders set status='refunded' where id=oc;
 if (select stock from public.inventory where variant_id=va)<>0 then raise exception 'Shipped goods restocked without inspection';end if;
 -- Test purchases cannot touch customer stock, even for a sold-out variant.
 insert into public.orders(id,order_no,guest_email) values(ot,'STOCK-TEST-'||ot,'stock@example.invalid');
 insert into public.order_items(order_id,variant_id,product_name,unit_price,quantity,line_total) values(ot,va,'Test item',100,1,100);
 update public.orders set payment_status='paid',status='paid' where id=ot;
 if exists(select 1 from public.order_stock_allocations where order_id=ot) then raise exception 'Test touched inventory';end if;
 if has_function_privilege('anon','public.apply_order_stock(uuid,text)','EXECUTE') or has_function_privilege('authenticated','public.ensure_order_stock_reservation(uuid,integer)','EXECUTE') then raise exception 'Private stock RPC exposed';end if;
 perform set_config('request.jwt.claim.role','anon',true);
 begin perform public.confirm_order_payment(oa,pay_id);raise exception 'Anonymous approval accepted';
 exception when raise_exception then get stacked diagnostics message=MESSAGE_TEXT;if message<>'admin_required' then raise;end if;end;
end $test$;

rollback;
select 'Stock reservation, expiry, retry, atomic payment, idempotency, cancellation, multi-line rollback, dispatched returns and test isolation: passed; all fixtures rolled back' result;
