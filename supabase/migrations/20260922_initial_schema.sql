-- Elmas Triko initial commerce schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  full_name text not null,
  phone text,
  city text not null,
  district text not null,
  postal_code text,
  address_line text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  gender text check (gender in ('kadin','erkek','unisex')),
  product_type text,
  base_price numeric(12,2),
  compare_at_price numeric(12,2),
  currency text not null default 'TRY',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  color text,
  size text,
  price numeric(12,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory (
  variant_id uuid primary key references public.product_variants(id) on delete cascade,
  stock integer not null default 0 check (stock >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  guest_email text,
  guest_phone text,
  status text not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  currency text not null default 'TRY',
  payment_provider text,
  payment_status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  sku text,
  color text,
  size text,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null
);

create table if not exists public.order_addresses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null check (kind in ('shipping','billing')),
  full_name text not null,
  company_name text,
  tax_office text,
  tax_number text,
  phone text,
  city text not null,
  district text not null,
  postal_code text,
  address_line text not null
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_reference text,
  amount numeric(12,2) not null,
  status text not null default 'pending',
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'BasitKargo',
  tracking_code text,
  tracking_url text,
  status text not null default 'pending',
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'NES Portal',
  invoice_no text,
  status text not null default 'pending',
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_gender_idx on public.products(gender);
create index if not exists variants_product_idx on public.product_variants(product_id);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_created_idx on public.orders(created_at desc);

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory enable row level security;
alter table public.favorites enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_addresses enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.invoices enable row level security;

create policy "public read active categories" on public.categories
for select using (is_active = true);

create policy "public read active products" on public.products
for select using (is_active = true);

create policy "public read active variants" on public.product_variants
for select using (is_active = true);

create policy "public read product images" on public.product_images
for select using (true);

create policy "public read inventory" on public.inventory
for select using (true);

create policy "users read own profile" on public.profiles
for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "users manage own addresses" on public.addresses
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own favorites" on public.favorites
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users read own orders" on public.orders
for select using (auth.uid() = user_id);
create policy "users create own orders" on public.orders
for insert with check (auth.uid() = user_id);

create policy "users read own order items" on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  )
);

create policy "users read own order addresses" on public.order_addresses
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_addresses.order_id and o.user_id = auth.uid()
  )
);

create policy "users read own payments" on public.payments
for select using (
  exists (
    select 1 from public.orders o
    where o.id = payments.order_id and o.user_id = auth.uid()
  )
);

create policy "users read own shipments" on public.shipments
for select using (
  exists (
    select 1 from public.orders o
    where o.id = shipments.order_id and o.user_id = auth.uid()
  )
);

create policy "users read own invoices" on public.invoices
for select using (
  exists (
    select 1 from public.orders o
    where o.id = invoices.order_id and o.user_id = auth.uid()
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
