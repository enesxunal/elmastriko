begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='admin' limit 1),true);
insert into public.analytics_sessions(id,visitor_id,started_at,last_seen_at) select ('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,gen_random_uuid(),'2091-01-01 10:00Z','2091-01-01 10:10Z' from generate_series(1,3)n;
insert into public.analytics_pageviews(id,session_id,visitor_id,path,entered_at) select ('20000000-0000-4000-8000-'||lpad((n+10)::text,12,'0'))::uuid,id,visitor_id,case when n=1 then '/urun/measurement-regression' else '/checkout' end,'2091-01-01 10:00Z' from generate_series(1,3)n join public.analytics_sessions s on s.id=('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid;
insert into public.analytics_events(id,session_id,pageview_id,kind,occurred_at)
select gen_random_uuid(),('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,('20000000-0000-4000-8000-'||lpad((n+10)::text,12,'0'))::uuid,kind,'2091-01-01 10:00Z'::timestamptz+mins*interval '1 minute'
from (values(1,'page_view',0),(1,'view_item',1),(1,'add_to_cart',2),(1,'add_to_cart',3),(1,'begin_checkout',4),(2,'page_view',0),(2,'begin_checkout',1),(3,'page_view',0),(3,'add_to_cart',1),(3,'begin_checkout',2)) v(n,kind,mins);
insert into public.checkout_diagnostics(session_id,stage,is_test,created_at) values('20000000-0000-4000-8000-000000000003','order_created',true,'2091-01-01 10:02Z');
do $test$ declare r jsonb; t jsonb; begin
 r:=public.store_analytics_report('2091-01-01','2091-01-02','day');
 select value into t from jsonb_array_elements(r->'eventTotals') where value->>'kind'='add_to_cart';
 if (t->>'events')::int<>2 or (t->>'sessions')::int<>1 then raise exception 'Repeat actions must count as 2 events in 1 session'; end if;
 select value into t from jsonb_array_elements(r->'eventTotals') where value->>'kind'='begin_checkout';
 if (t->>'events')::int<>2 or (t->>'sessions')::int<>2 then raise exception 'Raw checkouts must include direct entry'; end if;
 if (r->'funnel'->>'checkout')::int<>1 then raise exception 'Closed funnel must keep sequence requirement'; end if;
 if (r->>'excludedTestSessions')::int<>1 or (r->'summary'->>'sessions')::int<>2 or (r->'summary'->>'pageviews')::int<>2 then raise exception 'Technical test leaked into customer metrics'; end if;
 if jsonb_array_length(r->'recent')<>2 then raise exception 'Technical test leaked into recent sessions'; end if;
 if has_function_privilege('anon','public.store_analytics_report(timestamptz,timestamptz,text)','EXECUTE') then raise exception 'Anonymous report access'; end if;
 perform set_config('request.jwt.claim.sub','',true);
 begin perform public.store_analytics_report('2091-01-01','2091-01-02','day'); raise exception 'Unauthorized report accepted'; exception when insufficient_privilege then null; end;
end $test$;
rollback;
select 'Raw events vs sessions, direct checkout vs closed funnel, test exclusions across reports, and admin-only access: passed; all synthetic rows rolled back' as result;
