begin;
-- All synthetic events below are rolled back. No orders or payments are created.
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='admin' limit 1),true);
insert into public.checkout_diagnostics(session_id,attempt_id,stage,occurred_at,is_test) values
('10000000-0000-4000-8000-000000000020','10000000-0000-4000-8000-000000000021','form_started','2090-01-01 10:00Z',false),
('10000000-0000-4000-8000-000000000020','10000000-0000-4000-8000-000000000021','form_submitted','2090-01-01 10:01Z',false),
('10000000-0000-4000-8000-000000000020','10000000-0000-4000-8000-000000000021','form_submitted','2090-01-01 10:02Z',false),
('10000000-0000-4000-8000-000000000030','10000000-0000-4000-8000-000000000031','form_started','2090-01-01 10:00Z',false),
('10000000-0000-4000-8000-000000000030','10000000-0000-4000-8000-000000000031','order_created','2090-01-01 10:01Z',true);
insert into public.checkout_diagnostics(session_id,attempt_id,stage,error_code,field_group,occurred_at) values
('10000000-0000-4000-8000-000000000020','10000000-0000-4000-8000-000000000021','form_invalid','validation','contact','2090-01-01 10:03Z');
do $$declare r jsonb; n integer; begin
 r:=public.checkout_diagnostics_report('2090-01-01','2090-01-02');
 select (value->>'sessions')::int into n from jsonb_array_elements(r->'stages') where value->>'stage'='form_submitted';
 if n<>1 then raise exception 'Duplicate submits inflated sessions'; end if;
 select (value->>'events')::int into n from jsonb_array_elements(r->'stages') where value->>'stage'='form_started';
 if n<>1 then raise exception 'Test attempt leaked into production report'; end if;
 if jsonb_array_length(r->'recent')<>1 then raise exception 'Attempts not grouped'; end if;
 if r->'recent'->0->>'stage'<>'form_invalid' then raise exception 'Latest stage incorrect'; end if;
 if r->'issues'->0->>'field_group'<>'contact' then raise exception 'Validation group missing'; end if;
 if has_table_privilege('anon','public.checkout_diagnostics','INSERT') or has_table_privilege('authenticated','public.checkout_diagnostics','SELECT') then raise exception 'Raw diagnostics are publicly accessible'; end if;
 perform set_config('request.jwt.claim.sub','',true);
 begin perform public.checkout_diagnostics_report('2090-01-01','2090-01-02'); raise exception 'Unauthorized report accepted';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
select '7 diagnostic reporting and access checks passed; synthetic rows rolled back' as result;
