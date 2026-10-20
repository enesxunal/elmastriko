begin;
-- Missing production migration: a durable ledger prevents duplicate order mail.
create table if not exists public.order_mail_deliveries (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 event_key text not null, recipient text not null, status text not null default 'sending',
 error_message text, sent_at timestamptz, created_at timestamptz not null default now(),
 unique(order_id,event_key,recipient)
);
alter table public.order_mail_deliveries enable row level security;
revoke all on public.order_mail_deliveries from anon, authenticated;
grant all on public.order_mail_deliveries to service_role;

create table if not exists public.checkout_diagnostics (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 session_id uuid, attempt_id uuid, order_id uuid references public.orders(id) on delete set null,
 stage text not null check(stage in ('form_started','form_invalid','form_submitted','order_created','order_failed',
 'payment_session_created','payment_session_failed','card_page_viewed','card_form_invalid','card_submitted',
 'payment_verified','payment_failed','verification_pending','eft_started')),
 error_code text check(error_code in ('validation','network','server','stock','variant','price','shipping','provider','database','unknown')),
 field_group text check(field_group in ('contact','address','invoice','card')),
 is_test boolean not null default false
);
alter table public.checkout_diagnostics add column if not exists provider_code text check(provider_code ~ '^[a-zA-Z0-9_-]{1,12}$');
create index if not exists checkout_diagnostics_time on public.checkout_diagnostics(created_at);
create index if not exists checkout_diagnostics_attempt on public.checkout_diagnostics(attempt_id,created_at);
create index if not exists checkout_diagnostics_order on public.checkout_diagnostics(order_id);
create index if not exists checkout_diagnostics_session on public.checkout_diagnostics(session_id,created_at);
alter table public.checkout_diagnostics enable row level security;
revoke all on public.checkout_diagnostics from anon, authenticated;
grant all on public.checkout_diagnostics to service_role;
insert into public.analytics_measurement_versions(version) values(3) on conflict do nothing;

create or replace function public.checkout_diagnostics_report(p_from timestamptz,p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if p_to<=p_from or p_to-p_from>interval '10 years' then raise exception 'invalid_range'; end if;
 with clean as (
   select d.* from public.checkout_diagnostics d
   where d.created_at>=p_from and d.created_at<p_to and not d.is_test
     and not exists(select 1 from public.checkout_diagnostics t where t.is_test and
       ((t.attempt_id is not null and t.attempt_id=d.attempt_id) or (t.order_id is not null and t.order_id=d.order_id)))
 ), stages as (
   select stage,count(*) events,count(distinct coalesce(session_id,attempt_id,order_id,id)) sessions from clean group by stage
 ), issues as (
   select stage,coalesce(error_code,'unknown') code,field_group,provider_code,count(*) count from clean
   where stage in ('form_invalid','order_failed','payment_session_failed','card_form_invalid','payment_failed')
   group by stage,error_code,field_group,provider_code order by count(*) desc limit 15
 ), attempts as (
   select coalesce(attempt_id,order_id,session_id,id) attempt_id,max(created_at) last_at,
     (array_agg(stage order by created_at desc))[1] stage,
     (array_agg(order_id order by created_at desc) filter(where order_id is not null))[1] order_id,
     (array_agg(session_id order by created_at desc) filter(where session_id is not null))[1] session_id
   from clean group by coalesce(attempt_id,order_id,session_id,id)
 ), recent as (
   select a.attempt_id,a.last_at,a.stage,coalesce(s.source,'Ölçülemeyen kaynak') source,coalesce(s.device_type,'—') device,
     o.order_no,o.payment_status,a.last_at<now()-interval '30 minutes' inactive
   from attempts a left join public.analytics_sessions s on s.id=a.session_id left join public.orders o on o.id=a.order_id
   order by a.last_at desc limit 30
 )
 select jsonb_build_object(
   'measurementStartedAt',(select started_at from public.analytics_measurement_versions where version=3),
   'stages',coalesce((select jsonb_agg(to_jsonb(stages)) from stages),'[]'::jsonb),
   'issues',coalesce((select jsonb_agg(to_jsonb(issues)) from issues),'[]'::jsonb),
   'recent',coalesce((select jsonb_agg(to_jsonb(recent)) from recent),'[]'::jsonb)
 ) into result;
 return result;
end $$;
revoke all on function public.checkout_diagnostics_report(timestamptz,timestamptz) from public,anon;
grant execute on function public.checkout_diagnostics_report(timestamptz,timestamptz) to authenticated;
commit;
