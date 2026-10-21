begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='admin' limit 1),true);
do $test$
declare oid uuid:=gen_random_uuid(); aid uuid:=gen_random_uuid(); before_report jsonb; after_report jsonb; first_paid timestamptz; from_at timestamptz:=now()-interval '1 minute'; to_at timestamptz:=now()+interval '1 minute'; n integer;
begin
 before_report:=public.store_payment_activity_report(from_at,to_at);
 insert into public.orders(id,order_no,guest_email,created_at,grand_total,status,payment_status)
 values(oid,'REGRESSION-'||oid,'payment-regression@local.test',now()-interval '1 day',1199,'awaiting_payment','pending');
 update public.orders set payment_status='paid',status='paid' where id=oid;
 select paid_at into first_paid from public.orders where id=oid;
 if first_paid is null then raise exception 'Missing first payment timestamp'; end if;
 after_report:=public.store_payment_activity_report(from_at,to_at);
 if (after_report->>'orders')::int<>(before_report->>'orders')::int+1 or (after_report->>'fromEarlierOrders')::int<>(before_report->>'fromEarlierOrders')::int+1 then raise exception 'Previous-day order paid today not counted'; end if;
 update public.orders set updated_at=now()+interval '2 days',status='shipped',paid_at=now()+interval '2 days' where id=oid;
 if (select paid_at from public.orders where id=oid)<>first_paid then raise exception 'Shipping/repeated save changed first payment time'; end if;
 insert into public.checkout_diagnostics(order_id,stage) values(oid,'payment_verified'),(oid,'payment_verified');
 select count(*) into n from public.checkout_diagnostics where order_id=oid and stage='payment_verified';
 if n<>1 then raise exception 'Repeated payment verification was counted twice'; end if;
 update public.orders set is_test=true,archived_at=now(),status='cancelled' where id=oid;
 after_report:=public.store_payment_activity_report(from_at,to_at);
 if (after_report->>'orders')::int<>(before_report->>'orders')::int then raise exception 'Archived/test payment leaked into real receipts'; end if;
 insert into public.orders(id,order_no,user_id,payment_status) values(aid,'REGRESSION-'||aid,(select id from public.profiles where role='admin' limit 1),'pending');
 if not(select is_test from public.orders where id=aid) then raise exception 'Admin checkout was not classified as test'; end if;
 insert into public.checkout_diagnostics(order_id,stage) values(aid,'order_created');
 if not(select is_test from public.checkout_diagnostics where order_id=aid) then raise exception 'Admin diagnostic leaked into customer funnel'; end if;
 if has_function_privilege('anon','public.store_payment_activity_report(timestamptz,timestamptz)','EXECUTE') then raise exception 'Anonymous payment report access'; end if;
 perform set_config('request.jwt.claim.sub','',true);
 begin perform public.store_payment_activity_report(from_at,to_at);raise exception 'Unauthorized report accepted';exception when insufficient_privilege then null;end;
end $test$;
rollback;
select 'Payment date vs order date, immutable first approval, duplicate approval suppression, test/archive isolation, automatic admin test classification and report authorization: passed (all fixtures rolled back)' result;
