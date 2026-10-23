begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='admin' limit 1),true);
insert into public.analytics_sessions(id,visitor_id,started_at,last_seen_at)
select ('23000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,gen_random_uuid(),'2092-01-01 10:00Z','2092-01-01 10:10Z' from generate_series(1,4)n;
insert into public.analytics_pageviews(id,session_id,visitor_id,path,entered_at)
select ('23000000-0000-4000-8000-'||lpad((n+10)::text,12,'0'))::uuid,id,visitor_id,'/checkout','2092-01-01 10:00Z' from generate_series(1,4)n join public.analytics_sessions s on s.id=('23000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid;
insert into public.analytics_events(id,session_id,pageview_id,kind,occurred_at)
select gen_random_uuid(),('23000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,('23000000-0000-4000-8000-'||lpad((n+10)::text,12,'0'))::uuid,kind,'2092-01-01 10:00Z'::timestamptz+mins*interval '1 minute'
from(values(1,'add_to_cart',0),(1,'add_to_cart',1),(1,'begin_checkout',2),(2,'add_to_cart',0),(3,'begin_checkout',0),(4,'begin_checkout',0),(4,'begin_checkout',1)) v(n,kind,mins);
insert into public.checkout_diagnostics(session_id,attempt_id,stage,occurred_at,is_test) values
('23000000-0000-4000-8000-000000000003',gen_random_uuid(),'form_started','2092-01-01 10:00Z',true),
('23000000-0000-4000-8000-000000000004','23000000-0000-4000-8000-000000000021','form_started','2092-01-01 10:01Z',false),
('23000000-0000-4000-8000-000000000004','23000000-0000-4000-8000-000000000022','form_submitted','2092-01-01 10:03Z',false);
insert into public.checkout_diagnostics(session_id,attempt_id,stage,occurred_at,client_event_id,error_code,field_group,field_name)
values('23000000-0000-4000-8000-000000000004','23000000-0000-4000-8000-000000000021','form_invalid','2092-01-01 10:02Z','23000000-0000-4000-8000-000000000023','validation','contact','phone');
insert into public.checkout_diagnostics(client_event_id,stage) values('23000000-0000-4000-8000-000000000023','form_invalid') on conflict(client_event_id) do nothing;
do $test$
declare r jsonb; upper_report jsonb; a jsonb; b jsonb; journey jsonb; n integer; previous_at timestamptz; e jsonb;
begin
 r:=public.checkout_diagnostics_report('2092-01-01','2092-01-02');
 upper_report:=public.store_analytics_report('2092-01-01','2092-01-02','day');
 select value into a from jsonb_array_elements(r->'stages') where value->>'stage'='checkout_viewed';
 select value into b from jsonb_array_elements(upper_report->'eventTotals') where value->>'kind'='begin_checkout';
 if a->'events'<>b->'events' or a->'sessions'<>b->'sessions' or (a->>'events')::int<>3 or (a->>'sessions')::int<>2 then raise exception 'Checkout counts diverged between reports';end if;
 select value into a from jsonb_array_elements(r->'stages') where value->>'stage'='cart_added';
 select value into b from jsonb_array_elements(upper_report->'eventTotals') where value->>'kind'='add_to_cart';
 if a->'events'<>b->'events' or a->'sessions'<>b->'sessions' then raise exception 'Cart counts diverged between reports';end if;
 if jsonb_array_length(r->'recent')<>3 then raise exception 'Test exclusion/session reload grouping failed';end if;
 select value into journey from jsonb_array_elements(r->'recent') where value->>'attempt_id'='23000000-0000-4000-8000-000000000001';
 if journey is null or journey->>'stage'<>'checkout_viewed' then raise exception 'Checkout without form is invisible';end if;
 if exists(select 1 from jsonb_array_elements(journey->'timeline') t where t->>'stage'='form_started') then raise exception 'Historical form interaction invented';end if;
 select value into journey from jsonb_array_elements(r->'recent') where value->>'attempt_id'='23000000-0000-4000-8000-000000000004';
 if journey->>'stage'<>'form_submitted' then raise exception 'Reload split or chronology incorrect';end if;
 for e in select value from jsonb_array_elements(journey->'timeline') loop
  if previous_at is not null and (e->>'at')::timestamptz<previous_at then raise exception 'Timeline is out of order';end if;
  previous_at:=(e->>'at')::timestamptz;
 end loop;
 if (select count(*) from public.checkout_diagnostics where client_event_id='23000000-0000-4000-8000-000000000023')<>1 then raise exception 'Retry counted twice';end if;
 if r->'issues'->0->>'field_name'<>'phone' then raise exception 'Specific failed field is missing';end if;
 begin insert into public.checkout_diagnostics(stage,field_name) values('form_invalid','customer@example.com');raise exception 'Raw field value accepted';exception when check_violation then null;end;
 if has_function_privilege('anon','public.checkout_diagnostics_report(timestamptz,timestamptz)','EXECUTE') then raise exception 'Anonymous journey access';end if;
end $test$;
rollback;
select 'Same checkout/cart totals, checkout-without-form visibility, no invented interactions, session reload grouping, ordered timeline, retry deduplication, field privacy and authorization: passed; all fixtures rolled back' result;
