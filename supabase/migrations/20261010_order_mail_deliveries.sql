create table if not exists public.order_mail_deliveries (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 event_key text not null, recipient text not null, status text not null default 'sending',
 error_message text, sent_at timestamptz, created_at timestamptz not null default now(),
 unique(order_id,event_key,recipient)
);
alter table public.order_mail_deliveries enable row level security;
-- Only server-side service-role access: no public policies.
