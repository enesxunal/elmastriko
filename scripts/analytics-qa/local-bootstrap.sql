-- Test fixture only. Run exclusively in the isolated elmas-analytics-qa-20261015 container.
create or replace function public.is_admin() returns boolean language sql stable as $$
  select coalesce(current_setting('test.is_admin',true),'false')='true';
$$;
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  grand_total numeric not null default 0,
  payment_status text not null default 'pending',
  status text not null default 'awaiting_payment',
  created_at timestamptz not null default now()
);
