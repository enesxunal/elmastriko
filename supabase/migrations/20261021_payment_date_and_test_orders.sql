begin;
alter table public.orders add column if not exists is_test boolean not null default false;
alter table public.orders add column if not exists archived_at timestamptz;
alter table public.orders add column if not exists paid_at timestamptz;
create index if not exists orders_paid_at on public.orders(paid_at) where payment_status='paid' and not is_test and archived_at is null;
-- Preserve the first confirmed payment time, independently of creation/shipping dates.
update public.orders o set paid_at=coalesce(
 (select min(created_at) from public.audit_logs a where a.entity_id=o.id::text and a.entity_type='bank_transfer_payment' and a.action='approve'),
 (select min(created_at) from public.checkout_diagnostics d where d.order_id=o.id and d.stage='payment_verified'),
 (select min(updated_at) from public.payments p where p.order_id=o.id and p.status='paid'))
where o.payment_status='paid' and o.paid_at is null;
create or replace function public.order_measurement_identity() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
  new.is_test := coalesce(new.guest_email,'') ~* '@example\.invalid$' or exists(select 1 from public.profiles p where p.id=new.user_id and p.role='admin');
  new.archived_at:=null;
  new.paid_at:=case when new.payment_status='paid' then clock_timestamp() else null end;
 else
  if auth.role() in ('anon','authenticated') and not public.is_admin() and
    (new.is_test is distinct from old.is_test or new.archived_at is distinct from old.archived_at) then
    raise exception 'admin_required' using errcode='42501';
  end if;
  new.paid_at:=coalesce(old.paid_at,case when new.payment_status='paid' then clock_timestamp() else null end);
 end if;
 return new;
end $$;
revoke all on function public.order_measurement_identity() from public;
drop trigger if exists order_measurement_identity on public.orders;
create trigger order_measurement_identity before insert or update on public.orders for each row execute function public.order_measurement_identity();
-- Repeated approval requests must never create another verified-payment event.
create or replace function public.checkout_verified_once() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.stage='payment_verified' and new.order_id is not null then
  perform pg_advisory_xact_lock(hashtextextended(new.order_id::text,17));
  if exists(select 1 from public.checkout_diagnostics where order_id=new.order_id and stage='payment_verified') then return null; end if;
 end if;
 if new.order_id is not null and exists(select 1 from public.orders where id=new.order_id and (is_test or archived_at is not null)) then new.is_test:=true; end if;
 return new;
end $$;
revoke all on function public.checkout_verified_once() from public;
drop trigger if exists checkout_verified_once on public.checkout_diagnostics;
create trigger checkout_verified_once before insert on public.checkout_diagnostics for each row execute function public.checkout_verified_once();
create or replace function public.store_analytics_report(p_from timestamptz,p_to timestamptz,p_bucket text default 'day')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; step interval;
begin
  if not public.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  if p_from is null or p_to is null or p_to<=p_from or p_to-p_from>interval '10 years' then raise exception 'invalid_range'; end if;
  step:=case p_bucket when 'hour' then interval '1 hour' when 'week' then interval '7 days' else interval '1 day' end;
  if p_to-p_from>interval '3 days' and p_bucket='hour' then raise exception 'range_too_large_for_hour'; end if;
  with
  excluded_sessions as materialized(
    select distinct session_id from public.checkout_diagnostics where is_test and session_id is not null
    union select a.session_id from public.analytics_order_attribution a join public.orders o on o.id=a.order_id where o.is_test or o.archived_at is not null or o.guest_email ~* '@example\.invalid$'
  ),
  pv as materialized(select * from public.analytics_pageviews p where entered_at>=p_from and entered_at<p_to and not exists(select 1 from excluded_sessions x where x.session_id=p.session_id)),
  ev as materialized(select * from public.analytics_events e where occurred_at>=p_from and occurred_at<p_to and not exists(select 1 from excluded_sessions x where x.session_id=e.session_id)),
  ids as(select session_id from pv union select session_id from ev),
  sessions as materialized(select s.* from public.analytics_sessions s join ids on ids.session_id=s.id),
  timing as(select session_id,sum(active_ms)::bigint active_ms from ev group by session_id),
  page_counts as(select session_id,count(*) views from pv group by session_id),
  cohort as materialized(select s.* from public.analytics_sessions s where s.started_at>=p_from and s.started_at<p_to
    and exists(select 1 from public.analytics_events e where e.session_id=s.id)
    and not exists(select 1 from excluded_sessions x where x.session_id=s.id)),
  steps as materialized(
    select s.id,s.source,s.device_type,p.at product_at,a.at cart_at,c.at checkout_at,o.orders,o.amount
    from cohort s
    left join lateral(select min(occurred_at) at from public.analytics_events where occurred_at>=p_from and occurred_at<p_to and session_id=s.id and kind in ('view_item','add_to_cart')) p on true
    left join lateral(select min(occurred_at) at from public.analytics_events where occurred_at>=p_from and occurred_at<p_to and session_id=s.id and kind='add_to_cart' and occurred_at>=p.at) a on true
    left join lateral(select min(occurred_at) at from public.analytics_events where occurred_at>=p_from and occurred_at<p_to and session_id=s.id and kind='begin_checkout' and occurred_at>=a.at) c on true
    left join lateral(select count(*) orders,coalesce(sum(o.grand_total),0) amount from public.analytics_order_attribution ao
      join public.orders o on o.id=ao.order_id
      where ao.session_id=s.id and ao.created_at>=c.at and ao.created_at<p_to and o.payment_status='paid'
        and not o.is_test and o.archived_at is null and o.status not in ('cancelled','refunded','returned')) o on true
  ),
  buckets as(select generate_series(date_bin(step,p_from,timestamptz '2000-01-03 00:00:00+03'),p_to-interval '1 microsecond',step) at),
  trend_views as(select date_bin(step,entered_at,timestamptz '2000-01-03 00:00:00+03') at,count(*) views from pv group by 1),
  activity as(select session_id,visitor_id,entered_at at from pv union all select e.session_id,s.visitor_id,e.occurred_at from ev e join sessions s on s.id=e.session_id),
  trend_sessions as(select date_bin(step,at,timestamptz '2000-01-03 00:00:00+03') at,count(distinct session_id) sessions,count(distinct visitor_id) visitors from activity group by 1),
  trend_timing as(select date_bin(step,occurred_at,timestamptz '2000-01-03 00:00:00+03') at,sum(active_ms) ms,count(distinct session_id) measured from ev group by 1),
  page_stats as(select p.path,count(*) views,count(distinct p.session_id) sessions from pv p group by p.path),
  page_time as(select p.path,sum(e.active_ms) ms,count(distinct e.pageview_id) measured from ev e join public.analytics_pageviews p on p.id=e.pageview_id group by p.path)
  select jsonb_build_object(
    'from',p_from,'to',p_to,'bucket',p_bucket,
    'measurementStartedAt',(select started_at from public.analytics_measurement_versions where version=2),
    'lastEventAt',(select max(occurred_at) from public.analytics_events e where not exists(select 1 from excluded_sessions x where x.session_id=e.session_id)),
    'eventAlignmentStartedAt',(select started_at from public.analytics_measurement_versions where version=4),
    'eventTotals',(select jsonb_agg(jsonb_build_object('kind',k.kind,'events',(select count(*) from ev where kind=k.kind),'sessions',(select count(distinct session_id) from ev where kind=k.kind))) from (values('page_view'),('view_item'),('add_to_cart'),('begin_checkout')) k(kind)),
    'excludedTestSessions',(select count(distinct e.session_id) from public.analytics_events e join excluded_sessions x on x.session_id=e.session_id where e.occurred_at>=p_from and e.occurred_at<p_to),
    'summary',jsonb_build_object(
      'visitors',(select count(distinct visitor_id) from sessions),'sessions',(select count(*) from sessions),
      'pageviews',(select count(*) from pv),'activeMs',coalesce((select sum(active_ms) from ev),0),
      'measuredSessions',(select count(*) from timing),'measuredPages',(select count(distinct pageview_id) from ev),
      'activeNow',(select count(distinct session_id) from public.analytics_events where occurred_at>=now()-interval '5 minutes' and not exists(select 1 from excluded_sessions x where x.session_id=analytics_events.session_id)),
      'singlePageSessions',(select count(*) from sessions s left join page_counts p on p.session_id=s.id where coalesce(p.views,0)<=1)),
    'funnel',jsonb_build_object(
      'sessions',(select count(*) from steps),'product',(select count(*) from steps where product_at is not null),
      'cart',(select count(*) from steps where cart_at is not null),'checkout',(select count(*) from steps where checkout_at is not null),
      'purchase',(select count(*) from steps where orders>0),'orders',coalesce((select sum(orders) from steps),0),
      'revenue',coalesce((select sum(amount) from steps),0),
      'unattributedPaidOrders',(select count(*) from public.orders o where o.created_at>=p_from and o.created_at<p_to and o.payment_status='paid'
        and o.status not in ('cancelled','refunded','returned') and not o.is_test and o.archived_at is null and coalesce(o.guest_email,'') !~* '@example\.invalid$' and not exists(select 1 from public.analytics_order_attribution a where a.order_id=o.id))),
    'trend',coalesce((select jsonb_agg(jsonb_build_object('at',b.at,'views',coalesce(v.views,0),'sessions',coalesce(s.sessions,0),
      'visitors',coalesce(s.visitors,0),'activeMs',coalesce(t.ms,0),'measuredSessions',coalesce(t.measured,0)) order by b.at)
      from buckets b left join trend_views v using(at) left join trend_sessions s using(at) left join trend_timing t using(at)),'[]'::jsonb),
    'pages',coalesce((select jsonb_agg(x) from(select coalesce(p.path,t.path) path,coalesce(p.views,0) views,coalesce(p.sessions,0) sessions,
      case when t.measured>0 then t.ms/1000.0/t.measured else null end "avgSeconds"
      from page_stats p full join page_time t using(path) order by coalesce(p.views,0) desc limit 15)x),'[]'::jsonb),
    'sources',coalesce((select jsonb_agg(x) from(select s.source name,count(*) sessions,count(distinct s.visitor_id) visitors,
      coalesce(sum(t.active_ms),0)/1000.0/nullif(count(t.session_id),0) "avgSeconds",count(*) filter(where f.orders>0) purchases
      from sessions s left join timing t on t.session_id=s.id left join steps f on f.id=s.id group by s.source order by count(*) desc limit 10)x),'[]'::jsonb),
    'devices',coalesce((select jsonb_agg(x) from(select coalesce(s.device_type,'Bilinmiyor') name,count(*) sessions,
      count(*) filter(where f.orders>0) purchases from sessions s left join steps f on f.id=s.id group by s.device_type order by count(*) desc)x),'[]'::jsonb),
    'recent',coalesce((select jsonb_agg(x) from(select s.id,s.started_at,s.source,s.entry_path,s.exit_path,s.device_type,
      coalesce(p.views,0) pageviews,t.active_ms/1000.0 seconds from sessions s left join timing t on t.session_id=s.id
      left join page_counts p on p.session_id=s.id order by s.last_seen_at desc limit 12)x),'[]'::jsonb)
  ) into result;
  return result;
end; $$;
revoke all on function public.store_analytics_report(timestamptz,timestamptz,text) from public,anon;
grant execute on function public.store_analytics_report(timestamptz,timestamptz,text) to authenticated;
create or replace function public.checkout_diagnostics_report(p_from timestamptz,p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if p_to<=p_from or p_to-p_from>interval '10 years' then raise exception 'invalid_range'; end if;
 with clean as (
   select d.* from (select distinct on (case when stage='payment_verified' and order_id is not null then order_id else id end,stage) *
     from public.checkout_diagnostics order by case when stage='payment_verified' and order_id is not null then order_id else id end,stage,created_at,id) d
   where not exists(select 1 from public.orders o where o.id=d.order_id and (o.is_test or o.archived_at is not null)) and d.created_at>=p_from and d.created_at<p_to and not d.is_test
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

create or replace function public.store_payment_activity_report(p_from timestamptz,p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if p_from is null or p_to is null or p_to<=p_from or p_to-p_from>interval '10 years' then raise exception 'invalid_range'; end if;
 with payments as (select id,order_no,grand_total,currency,created_at,paid_at,payment_provider from public.orders
   where paid_at>=p_from and paid_at<p_to and payment_status='paid' and status not in('cancelled','refunded','returned') and not is_test and archived_at is null)
 select jsonb_build_object('orders',(select count(*) from payments),'revenue',(select coalesce(sum(grand_total),0) from payments),
 'fromEarlierOrders',(select count(*) from payments where created_at<p_from),
 'excludedTests',(select count(*) from public.orders where paid_at>=p_from and paid_at<p_to and is_test),
 'recent',coalesce((select jsonb_agg(x) from (select order_no,created_at,paid_at,grand_total,currency,payment_provider from payments order by paid_at desc limit 20)x),'[]'::jsonb)) into result;
 return result;
end $$;
revoke all on function public.store_payment_activity_report(timestamptz,timestamptz) from public,anon;
grant execute on function public.store_payment_activity_report(timestamptz,timestamptz) to authenticated;
notify pgrst,'reload schema';
commit;
