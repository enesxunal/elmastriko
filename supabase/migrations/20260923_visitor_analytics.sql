begin;

create table if not exists public.analytics_sessions (
  id uuid primary key,
  visitor_id uuid not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  pageviews integer not null default 0 check (pageviews >= 0),
  entry_path text not null default '/',
  exit_path text not null default '/',
  referrer text,
  referrer_host text,
  source text not null default 'Direct',
  medium text,
  campaign text,
  device_type text,
  browser text,
  os text,
  screen_width integer,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_pageviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.analytics_sessions(id) on delete cascade,
  visitor_id uuid not null,
  path text not null,
  page_title text,
  entered_at timestamptz not null default now(),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  created_at timestamptz not null default now()
);

create index if not exists analytics_sessions_started_idx on public.analytics_sessions(started_at desc);
create index if not exists analytics_sessions_last_seen_idx on public.analytics_sessions(last_seen_at desc);
create index if not exists analytics_sessions_visitor_idx on public.analytics_sessions(visitor_id);
create index if not exists analytics_pageviews_entered_idx on public.analytics_pageviews(entered_at desc);
create index if not exists analytics_pageviews_path_idx on public.analytics_pageviews(path);
create index if not exists analytics_pageviews_session_idx on public.analytics_pageviews(session_id);

alter table public.analytics_sessions enable row level security;
alter table public.analytics_pageviews enable row level security;

drop policy if exists "admins read analytics sessions" on public.analytics_sessions;
create policy "admins read analytics sessions" on public.analytics_sessions
for select using (public.is_admin());

drop policy if exists "admins read analytics pageviews" on public.analytics_pageviews;
create policy "admins read analytics pageviews" on public.analytics_pageviews
for select using (public.is_admin());

create or replace function public.track_analytics_page(
  p_session_id uuid,
  p_visitor_id uuid,
  p_path text,
  p_title text,
  p_referrer text,
  p_referrer_host text,
  p_source text,
  p_medium text,
  p_campaign text,
  p_device_type text,
  p_browser text,
  p_os text,
  p_screen_width integer
)
returns uuid
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_pageview_id uuid;
  v_path text := left(coalesce(nullif(trim(p_path),''),'/'),500);
begin
  if v_path like '/yonetim%' or v_path like '/api/%' then
    return null;
  end if;

  insert into public.analytics_sessions(
    id,visitor_id,entry_path,exit_path,referrer,referrer_host,source,medium,campaign,
    device_type,browser,os,screen_width,pageviews,last_seen_at
  )
  values(
    p_session_id,p_visitor_id,v_path,v_path,
    nullif(left(coalesce(p_referrer,''),1000),''),
    nullif(left(coalesce(p_referrer_host,''),255),''),
    left(coalesce(nullif(trim(p_source),''),'Direct'),80),
    nullif(left(coalesce(p_medium,''),80),''),
    nullif(left(coalesce(p_campaign,''),160),''),
    nullif(left(coalesce(p_device_type,''),40),''),
    nullif(left(coalesce(p_browser,''),80),''),
    nullif(left(coalesce(p_os,''),80),''),
    greatest(0,least(coalesce(p_screen_width,0),10000)),
    1,
    now()
  )
  on conflict(id) do update set
    exit_path=excluded.exit_path,
    last_seen_at=now(),
    pageviews=public.analytics_sessions.pageviews+1;

  insert into public.analytics_pageviews(session_id,visitor_id,path,page_title)
  values(p_session_id,p_visitor_id,v_path,nullif(left(coalesce(p_title,''),300),''))
  returning id into v_pageview_id;

  return v_pageview_id;
end;
$$;

create or replace function public.track_analytics_engagement(
  p_session_id uuid,
  p_pageview_id uuid,
  p_seconds integer,
  p_path text
)
returns boolean
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_seconds integer := greatest(0,least(coalesce(p_seconds,0),60));
begin
  if v_seconds = 0 then return true; end if;

  update public.analytics_pageviews
  set duration_seconds=duration_seconds+v_seconds
  where id=p_pageview_id and session_id=p_session_id;

  update public.analytics_sessions
  set duration_seconds=duration_seconds+v_seconds,
      last_seen_at=now(),
      exit_path=left(coalesce(nullif(trim(p_path),''),exit_path),500)
  where id=p_session_id;

  return true;
end;
$$;

create or replace function public.analytics_active_now()
returns bigint
language sql
stable
security definer
set search_path=public,auth
as $$
  select case
    when public.is_admin() then (
      select count(*)::bigint
      from public.analytics_sessions
      where last_seen_at >= now() - interval '5 minutes'
    )
    else 0::bigint
  end;
$$;

revoke all on function public.track_analytics_page(uuid,uuid,text,text,text,text,text,text,text,text,text,text,integer) from public;
revoke all on function public.track_analytics_engagement(uuid,uuid,integer,text) from public;
revoke all on function public.analytics_active_now() from public;
grant execute on function public.track_analytics_page(uuid,uuid,text,text,text,text,text,text,text,text,text,text,integer) to anon,authenticated;
grant execute on function public.track_analytics_engagement(uuid,uuid,integer,text) to anon,authenticated;
grant execute on function public.analytics_active_now() to authenticated;

commit;
