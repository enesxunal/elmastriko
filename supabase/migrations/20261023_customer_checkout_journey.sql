begin;
alter table public.checkout_diagnostics add column if not exists client_event_id uuid;
alter table public.checkout_diagnostics add column if not exists occurred_at timestamptz;
update public.checkout_diagnostics set occurred_at=created_at where occurred_at is null;
alter table public.checkout_diagnostics alter column occurred_at set default now();
alter table public.checkout_diagnostics alter column occurred_at set not null;
alter table public.checkout_diagnostics add column if not exists field_name text check(field_name in ('firstName','lastName','email','phone','addressLine','city','district','companyName','taxOffice','taxNumber','invoiceEmail'));
create unique index if not exists checkout_client_event_once on public.checkout_diagnostics(client_event_id);
alter table public.checkout_diagnostics drop constraint if exists checkout_diagnostics_stage_check;
alter table public.checkout_diagnostics add constraint checkout_diagnostics_stage_check check(stage in (
 'contact_completed','address_completed','form_started','form_invalid','form_submitted','order_created','order_failed',
 'payment_session_created','payment_session_failed','card_page_viewed','card_form_invalid','card_submitted','payment_verified','payment_failed','verification_pending','eft_started'));
insert into public.analytics_measurement_versions(version) values(6) on conflict do nothing;

-- Both reports now read the SAME add_to_cart / begin_checkout rows. No synthetic
-- form interaction is invented for historical visitors who only opened checkout.
create or replace function public.checkout_diagnostics_report(p_from timestamptz,p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.is_admin() then raise exception 'admin_required' using errcode='42501';end if;
 if p_from is null or p_to is null or p_to<=p_from or p_to-p_from>interval '10 years' then raise exception 'invalid_range';end if;
 with excluded_sessions as materialized (
  select distinct session_id from public.checkout_diagnostics where is_test and session_id is not null
  union select a.session_id from public.analytics_order_attribution a join public.orders o on o.id=a.order_id where o.is_test or o.archived_at is not null or o.guest_email ~* '@example\.invalid$'
 ), diagnostics as materialized (
  select d.*,coalesce(d.session_id,a.session_id) resolved_session
  from public.checkout_diagnostics d left join public.analytics_order_attribution a on a.order_id=d.order_id
  where d.occurred_at>=p_from and d.occurred_at<p_to and not d.is_test
   and not exists(select 1 from public.orders o where o.id=d.order_id and (o.is_test or o.archived_at is not null))
   and not exists(select 1 from excluded_sessions x where x.session_id=coalesce(d.session_id,a.session_id))
   and not exists(select 1 from public.checkout_diagnostics t where t.is_test and
    ((t.attempt_id is not null and t.attempt_id=d.attempt_id) or (t.order_id is not null and t.order_id=d.order_id)))
 ), store_events as materialized (
  select e.*,p.path from public.analytics_events e join public.analytics_pageviews p on p.id=e.pageview_id
  where e.occurred_at>=p_from and e.occurred_at<p_to and e.kind<>'engagement'
   and not exists(select 1 from excluded_sessions x where x.session_id=e.session_id)
 ), intents as (
  select session_id from store_events where kind in ('add_to_cart','begin_checkout')
  union select resolved_session from diagnostics where resolved_session is not null
 ), events as materialized (
  select e.id,e.session_id journey_id,e.session_id,e.occurred_at at,
   case e.kind when 'add_to_cart' then 'cart_added' when 'begin_checkout' then 'checkout_viewed'
    when 'view_item' then 'product_viewed' when 'page_view' then case when e.path='/sepet' then 'cart_viewed' else 'page_visited' end end stage,
   null::uuid order_id,e.path,pr.name product_name,null::text code,null::text field_group,null::text field_name,null::text provider_code
  from store_events e join intents i on i.session_id=e.session_id left join public.products pr on pr.slug=e.product_slug
  where e.kind<>'page_view' or e.path not like '/urun/%'
  union all
  select d.id,coalesce(d.resolved_session,d.order_id,d.attempt_id,d.id),d.resolved_session,d.occurred_at,d.stage,d.order_id,
   null,null,d.error_code,d.field_group,d.field_name,d.provider_code from diagnostics d
  union all
  -- A real order remains visible even when browser diagnostics or consent are unavailable.
  select o.id,coalesce(a.session_id,o.id),a.session_id,o.created_at,'order_created',o.id,null,null,null,null,null,null
  from public.orders o left join public.analytics_order_attribution a on a.order_id=o.id
  where o.created_at>=p_from and o.created_at<p_to and not o.is_test and o.archived_at is null
   and not exists(select 1 from excluded_sessions x where x.session_id=a.session_id)
   and not exists(select 1 from public.checkout_diagnostics d where d.order_id=o.id and d.stage='order_created')
  union all
  select o.id,coalesce(a.session_id,o.id),a.session_id,o.paid_at,'payment_verified',o.id,null,null,null,null,null,null
  from public.orders o left join public.analytics_order_attribution a on a.order_id=o.id
  where o.paid_at>=p_from and o.paid_at<p_to and o.payment_status='paid' and not o.is_test and o.archived_at is null and o.status not in ('cancelled','refunded')
   and not exists(select 1 from excluded_sessions x where x.session_id=a.session_id)
   and not exists(select 1 from public.checkout_diagnostics d where d.order_id=o.id and d.stage='payment_verified')
 ), stages as (
  select stage,count(*) events,count(distinct journey_id) sessions from events where stage<>'page_visited' group by stage
 ), issues as (
  select stage,coalesce(code,'unknown') code,field_group,field_name,provider_code,count(*) count from events
  where stage in ('form_invalid','order_failed','payment_session_failed','card_form_invalid','payment_failed','verification_pending') and code is not null
  group by stage,code,field_group,field_name,provider_code order by count(*) desc limit 30
 ), attempts as (
  select journey_id attempt_id,min(at) first_at,max(at) last_at,
   (array_agg(stage order by at desc,id desc) filter(where stage not in ('page_visited','product_viewed','cart_viewed')))[1] stage,
   (array_agg(order_id order by at desc,id desc) filter(where order_id is not null))[1] order_id,
   (array_agg(session_id order by at desc,id desc) filter(where session_id is not null))[1] session_id,count(*) event_count
  from events group by journey_id
 ), recent as (
  select a.*,coalesce(s.source,'Kaynak ölçülemedi') source,coalesce(s.device_type,'—') device,coalesce(s.browser,'—') browser,
   o.order_no,o.payment_status,a.last_at<now()-interval '30 minutes' inactive,
   coalesce((select jsonb_agg(to_jsonb(t) order by t.at,t.id) from (
    select id,at,stage,path,product_name,code,field_group,field_name,provider_code from events e where e.journey_id=a.attempt_id order by at desc,id desc limit 120
   ) t),'[]'::jsonb) timeline
  from attempts a left join public.analytics_sessions s on s.id=a.session_id left join public.orders o on o.id=a.order_id
  order by a.last_at desc,a.attempt_id limit 30
 )
 select jsonb_build_object(
  'measurementStartedAt',(select started_at from public.analytics_measurement_versions where version=2),
  'detailStartedAt',(select started_at from public.analytics_measurement_versions where version=6),
  'stages',coalesce((select jsonb_agg(to_jsonb(stages)) from stages),'[]'::jsonb),
  'issues',coalesce((select jsonb_agg(to_jsonb(issues)) from issues),'[]'::jsonb),
  'recent',coalesce((select jsonb_agg(to_jsonb(recent)-'order_id'-'session_id') from recent),'[]'::jsonb)
 ) into result;
 return result;
end $$;
revoke all on function public.checkout_diagnostics_report(timestamptz,timestamptz) from public,anon;
grant execute on function public.checkout_diagnostics_report(timestamptz,timestamptz) to authenticated;
notify pgrst,'reload schema';
commit;
