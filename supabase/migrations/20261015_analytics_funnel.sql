begin;

-- Additive migration. Existing traffic, orders and product records are preserved.
create table if not exists public.analytics_measurement_versions (
  version integer primary key, started_at timestamptz not null default now()
);
insert into public.analytics_measurement_versions(version) values (2) on conflict do nothing;
alter table public.analytics_measurement_versions enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='analytics_measurement_versions' and policyname='analytics versions admin read') then
    execute 'create policy "analytics versions admin read" on public.analytics_measurement_versions for select using(public.is_admin())';
  end if;
end $$;

create table if not exists public.analytics_events (
  id uuid primary key,
  session_id uuid not null references public.analytics_sessions(id) on delete cascade,
  pageview_id uuid not null references public.analytics_pageviews(id) on delete cascade,
  kind text not null check (kind in ('page_view','engagement','view_item','add_to_cart','begin_checkout')),
  occurred_at timestamptz not null,
  active_ms integer not null default 0 check(active_ms between 0 and 20000),
  product_slug text,
  received_at timestamptz not null default now()
);
create index if not exists analytics_events_time_idx on public.analytics_events(occurred_at);
create index if not exists analytics_events_session_kind_idx on public.analytics_events(session_id,kind,occurred_at);
alter table public.analytics_events enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='analytics_events' and policyname='analytics events admin read') then
    execute 'create policy "analytics events admin read" on public.analytics_events for select using(public.is_admin())';
  end if;
end $$;

create table if not exists public.analytics_order_attribution (
  order_id uuid primary key references public.orders(id) on delete cascade,
  session_id uuid not null references public.analytics_sessions(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists analytics_order_session_idx on public.analytics_order_attribution(session_id);
alter table public.analytics_order_attribution enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='analytics_order_attribution' and policyname='analytics order attribution admin read') then
    execute 'create policy "analytics order attribution admin read" on public.analytics_order_attribution for select using(public.is_admin())';
  end if;
end $$;

-- The browser never submits purchases, prices, identity data or order IDs here.
create or replace function public.ingest_store_analytics(payload jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  sid uuid; vid uuid; pid uuid; eid uuid; event jsonb; metadata jsonb;
  event_kind text; event_path text; event_time timestamptz; milliseconds integer;
  inserted integer; page_inserted integer;
begin
  if payload is null or octet_length(payload::text)>20000 or jsonb_typeof(payload->'events') <> 'array'
     or jsonb_array_length(payload->'events') not between 1 and 20 then return false; end if;
  sid := (payload->>'sessionId')::uuid; vid := (payload->>'visitorId')::uuid;
  if sid is null or vid is null then return false; end if;
  metadata := coalesce(payload->'metadata','{}'::jsonb);
  insert into public.analytics_sessions(id,visitor_id,entry_path,exit_path,source,medium,campaign,referrer_host,device_type,browser,os,screen_width)
  values(sid,vid,'/','/',left(coalesce(nullif(metadata->>'source',''),'Direct'),80),left(metadata->>'medium',80),
    left(metadata->>'campaign',160),left(metadata->>'referrerHost',255),left(metadata->>'device',40),
    left(metadata->>'browser',80),left(metadata->>'os',80),greatest(0,least(coalesce((metadata->>'width')::integer,0),10000)))
  on conflict(id) do nothing;
  -- Serialize writes to the same session and reject another visitor's session ID.
  perform 1 from public.analytics_sessions where id=sid and visitor_id=vid for update;
  if not found then return false; end if;
  if (select count(*) from public.analytics_events where session_id=sid and received_at>now()-interval '1 minute')>180 then return false; end if;
  for event in select value from jsonb_array_elements(payload->'events') loop
    eid := (event->>'id')::uuid; pid := (event->>'pageId')::uuid;
    event_kind := event->>'kind';
    event_path := left(split_part(coalesce(event->>'path','/'),'?',1),500);
    if eid is null or pid is null or event_kind not in ('page_view','engagement','view_item','add_to_cart','begin_checkout')
       or event_path not like '/%' or event_path like '//%' or event_path ~ '^/(yonetim|api|auth|influencer)(/|$)' then continue; end if;
    event_time := greatest(now()-interval '5 minutes',least(now(),(event->>'at')::timestamptz));
    if event_time is null then event_time:=now(); end if;
    milliseconds := case when event_kind='engagement' then greatest(0,least(coalesce((event->>'activeMs')::integer,0),20000)) else 0 end;
    insert into public.analytics_pageviews(id,session_id,visitor_id,path,entered_at)
      values(pid,sid,vid,event_path,event_time) on conflict(id) do nothing;
    get diagnostics page_inserted=row_count;
    if not exists(select 1 from public.analytics_pageviews where id=pid and session_id=sid and visitor_id=vid) then continue; end if;
    insert into public.analytics_events(id,session_id,pageview_id,kind,occurred_at,active_ms,product_slug)
      values(eid,sid,pid,event_kind,event_time,milliseconds,left(event->>'slug',160)) on conflict(id) do nothing;
    get diagnostics inserted=row_count;
    if inserted=1 then
      update public.analytics_pageviews set entered_at=least(entered_at,event_time),
        duration_seconds=duration_seconds+milliseconds/1000 where id=pid;
      update public.analytics_sessions set
        entry_path=case when pageviews=0 then event_path else entry_path end,
        exit_path=case when pageviews=0 or event_time>=last_seen_at then event_path else exit_path end,
        started_at=least(started_at,event_time),last_seen_at=greatest(last_seen_at,event_time),
        pageviews=pageviews+page_inserted,duration_seconds=duration_seconds+milliseconds/1000 where id=sid;
    end if;
  end loop;
  return true;
exception when invalid_text_representation or datetime_field_overflow or numeric_value_out_of_range then
  return false;
end; $$;
revoke all on function public.ingest_store_analytics(jsonb) from public;
grant execute on function public.ingest_store_analytics(jsonb) to anon,authenticated;

-- Only the server can attach an order it has just created to a measured session.
create or replace function public.attribute_store_order(p_order_id uuid,p_session_id uuid,p_visitor_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.analytics_sessions where id=p_session_id and visitor_id=p_visitor_id and last_seen_at>now()-interval '30 minutes')
    or not exists(select 1 from public.orders where id=p_order_id and created_at>now()-interval '5 minutes') then return false; end if;
  insert into public.analytics_order_attribution(order_id,session_id) values(p_order_id,p_session_id) on conflict(order_id) do nothing;
  return true;
end; $$;
revoke all on function public.attribute_store_order(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.attribute_store_order(uuid,uuid,uuid) to service_role;

create or replace function public.store_analytics_report(p_from timestamptz,p_to timestamptz,p_bucket text default 'day')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; step interval;
begin
  if not public.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  if p_from is null or p_to is null or p_to<=p_from or p_to-p_from>interval '10 years' then raise exception 'invalid_range'; end if;
  step:=case p_bucket when 'hour' then interval '1 hour' when 'week' then interval '7 days' else interval '1 day' end;
  if p_to-p_from>interval '3 days' and p_bucket='hour' then raise exception 'range_too_large_for_hour'; end if;
  with
  pv as materialized(select * from public.analytics_pageviews where entered_at>=p_from and entered_at<p_to),
  ev as materialized(select * from public.analytics_events where occurred_at>=p_from and occurred_at<p_to),
  ids as(select session_id from pv union select session_id from ev),
  sessions as materialized(select s.* from public.analytics_sessions s join ids on ids.session_id=s.id),
  timing as(select session_id,sum(active_ms)::bigint active_ms from ev group by session_id),
  page_counts as(select session_id,count(*) views from pv group by session_id),
  cohort as materialized(select s.* from public.analytics_sessions s where s.started_at>=p_from and s.started_at<p_to
    and exists(select 1 from public.analytics_events e where e.session_id=s.id)),
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
    'lastEventAt',(select max(occurred_at) from public.analytics_events),
    'summary',jsonb_build_object(
      'visitors',(select count(distinct visitor_id) from sessions),'sessions',(select count(*) from sessions),
      'pageviews',(select count(*) from pv),'activeMs',coalesce((select sum(active_ms) from ev),0),
      'measuredSessions',(select count(*) from timing),'measuredPages',(select count(distinct pageview_id) from ev),
      'activeNow',(select count(distinct session_id) from public.analytics_events where occurred_at>=now()-interval '5 minutes'),
      'singlePageSessions',(select count(*) from sessions s left join page_counts p on p.session_id=s.id where coalesce(p.views,0)<=1)),
    'funnel',jsonb_build_object(
      'sessions',(select count(*) from steps),'product',(select count(*) from steps where product_at is not null),
      'cart',(select count(*) from steps where cart_at is not null),'checkout',(select count(*) from steps where checkout_at is not null),
      'purchase',(select count(*) from steps where orders>0),'orders',coalesce((select sum(orders) from steps),0),
      'revenue',coalesce((select sum(amount) from steps),0),
      'unattributedPaidOrders',(select count(*) from public.orders o where o.created_at>=p_from and o.created_at<p_to and o.payment_status='paid'
        and o.status not in ('cancelled','refunded','returned') and not exists(select 1 from public.analytics_order_attribution a where a.order_id=o.id))),
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
