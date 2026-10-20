begin;
insert into public.analytics_measurement_versions(version) values(4) on conflict do nothing;
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
    union select a.session_id from public.analytics_order_attribution a join public.orders o on o.id=a.order_id where o.guest_email ~* '@example\.invalid$'
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
        and o.status not in ('cancelled','refunded','returned')) o on true
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
        and o.status not in ('cancelled','refunded','returned') and coalesce(o.guest_email,'') !~* '@example\.invalid$' and not exists(select 1 from public.analytics_order_attribution a where a.order_id=o.id))),
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
notify pgrst,'reload schema';
commit;
