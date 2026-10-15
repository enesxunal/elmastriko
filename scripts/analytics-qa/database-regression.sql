-- All fixtures are synthetic and rolled back. Isolated QA database only.
begin;
set test.is_admin='true';
create or replace function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$ begin if not coalesce(ok,false) then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
create temporary table fixture(payload jsonb);
insert into fixture values(jsonb_build_object(
 'sessionId','11111111-1111-4111-8111-111111111111','visitorId','22222222-2222-4222-8222-222222222222',
 'metadata',jsonb_build_object('source','QA synthetic','device','Mobil','width',390),
 'events',jsonb_build_array(
 jsonb_build_object('id','33333333-3333-4333-8333-333333333333','pageId','33333333-3333-4333-8333-333333333333','kind','page_view','path','/urun/qa-item','at',now()-interval '4 minutes'),
 jsonb_build_object('id','44444444-4444-4444-8444-444444444444','pageId','33333333-3333-4333-8333-333333333333','kind','view_item','path','/urun/qa-item','at',now()-interval '3 minutes'),
 jsonb_build_object('id','55555555-5555-4555-8555-555555555555','pageId','33333333-3333-4333-8333-333333333333','kind','add_to_cart','path','/urun/qa-item','at',now()-interval '2 minutes'),
 jsonb_build_object('id','66666666-6666-4666-8666-666666666666','pageId','33333333-3333-4333-8333-333333333333','kind','begin_checkout','path','/checkout','at',now()-interval '1 minute'),
 jsonb_build_object('id','77777777-7777-4777-8777-777777777777','pageId','33333333-3333-4333-8333-333333333333','kind','engagement','path','/urun/qa-item','at',now(),'activeMs',15000)
 )));
select pg_temp.assert_true(public.ingest_store_analytics((select payload from fixture)),'event batch accepted');
select pg_temp.assert_true(public.ingest_store_analytics((select payload from fixture)),'same event batch safely replayed');
select pg_temp.assert_true((select count(*)=5 from public.analytics_events),'retries do not duplicate events');
select pg_temp.assert_true((select sum(active_ms)=15000 from public.analytics_events),'retries do not inflate active time');
select pg_temp.assert_true((select pageviews=1 from public.analytics_sessions limit 1),'page views idempotent');
select pg_temp.assert_true(not public.ingest_store_analytics(jsonb_set((select payload from fixture),'{visitorId}','"88888888-8888-4888-8888-888888888888"')),'visitor cannot reuse another session');
select pg_temp.assert_true((public.store_analytics_report(now()-interval '24 hours',now()+interval '1 second','hour')->'funnel'->>'purchase')::int=0,'checkout is not a purchase');
insert into public.orders(id,grand_total) values('99999999-9999-4999-8999-999999999999',1199);
select pg_temp.assert_true(public.attribute_store_order('99999999-9999-4999-8999-999999999999','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'),'order attribution succeeds for matching session');
select pg_temp.assert_true((public.store_analytics_report(now()-interval '24 hours',now()+interval '1 second','hour')->'funnel'->>'purchase')::int=0,'pending order excluded');
update public.orders set payment_status='paid',status='paid' where id='99999999-9999-4999-8999-999999999999';
select pg_temp.assert_true((public.store_analytics_report(now()-interval '24 hours',now()+interval '1 second','hour')->'funnel'->>'purchase')::int=1,'server confirmed paid order included');
update public.orders set payment_status='refunded',status='refunded' where id='99999999-9999-4999-8999-999999999999';
select pg_temp.assert_true((public.store_analytics_report(now()-interval '24 hours',now()+interval '1 second','hour')->'funnel'->>'purchase')::int=0,'refunded order excluded');
select pg_temp.assert_true(not has_function_privilege('anon','public.store_analytics_report(timestamptz,timestamptz,text)','EXECUTE'),'anonymous users cannot read reports');
select pg_temp.assert_true(not has_function_privilege('authenticated','public.attribute_store_order(uuid,uuid,uuid)','EXECUTE'),'browser users cannot attach orders');
select pg_temp.assert_true(has_function_privilege('service_role','public.attribute_store_order(uuid,uuid,uuid)','EXECUTE'),'server can attach orders');
set test.is_admin='false';
do $$ begin begin perform public.store_analytics_report(now()-interval '1 day',now(),'hour');raise exception 'nonadmin unexpectedly read report';exception when insufficient_privilege then raise notice 'PASS: non-admin denied even with execute privilege';end;end $$;
set test.is_admin='true';
-- More rows than the former browser-side limit, with complete SQL aggregation.
insert into public.analytics_sessions(id,visitor_id,started_at,last_seen_at)
select gen_random_uuid(),gen_random_uuid(),now()-interval '2 hours',now()-interval '1 hour' from generate_series(1,1500);
insert into public.analytics_pageviews(session_id,visitor_id,path,entered_at)
select s.id,s.visitor_id,'/qa-scale',now()-interval '1 hour' from public.analytics_sessions s cross join generate_series(1,8) where s.id<>'11111111-1111-4111-8111-111111111111';
select pg_temp.assert_true((public.store_analytics_report(now()-interval '1 day',now()+interval '1 second','hour')->'summary'->>'pageviews')::int=12001,'more than 10000 page views aggregated without truncation');
select pg_temp.assert_true((public.store_analytics_report(now()-interval '1 day',now()+interval '1 second','hour')->'summary'->>'sessions')::int=1501,'more than 1000 sessions counted exactly');
-- A session crossing the range boundary remains in activity totals, not the new-session funnel.
insert into public.analytics_sessions(id,visitor_id,started_at,last_seen_at) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',now()-interval '2 days',now());
insert into public.analytics_pageviews(id,session_id,visitor_id,path,entered_at) values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','/boundary',now()-interval '2 days');
insert into public.analytics_events(id,session_id,pageview_id,kind,occurred_at,active_ms) values(gen_random_uuid(),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cccccccc-cccc-4ccc-8ccc-cccccccccccc','engagement',now(),10000);
select pg_temp.assert_true((public.store_analytics_report(now()-interval '1 day',now()+interval '1 second','hour')->'summary'->>'sessions')::int=1502,'ongoing session included across range boundary');
select pg_temp.assert_true((public.store_analytics_report(now()-interval '1 day',now()+interval '1 second','hour')->'summary'->>'activeMs')::int=25000,'only engagement in the period counted');
select pg_temp.assert_true((public.store_analytics_report(now()-interval '1 day',now()+interval '1 second','hour')->'funnel'->>'sessions')::int=1,'funnel uses new-session cohort only');
select pg_temp.assert_true((public.store_analytics_report(now()-interval '5 days',now()-interval '4 days','hour')->'summary'->>'sessions')::int=0,'empty period remains zero');
rollback;
