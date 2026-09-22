begin;

alter table public.profiles add column if not exists role text not null default 'customer';
alter table public.profiles add column if not exists email text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='profiles_role_check') then
    alter table public.profiles add constraint profiles_role_check check (role in ('customer','admin'));
  end if;
end $$;
update public.profiles p set email=u.email from auth.users u where p.id=u.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email)
  on conflict (id) do update set email=excluded.email;
  return new;
end; $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null default '',
  cover_image text,
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_settings (
  provider text primary key,
  is_enabled boolean not null default false,
  status text not null default 'not_configured',
  public_config jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;
alter table public.site_settings enable row level security;
alter table public.integration_settings enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "public read published blog" on public.blog_posts;
create policy "public read published blog" on public.blog_posts for select using (status='published');
drop policy if exists "public read public settings" on public.site_settings;
create policy "public read public settings" on public.site_settings for select using (key in ('seo','contact','social','commerce'));
drop policy if exists "admins manage blog" on public.blog_posts;
create policy "admins manage blog" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage site settings" on public.site_settings;
create policy "admins manage site settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage integration settings" on public.integration_settings;
create policy "admins manage integration settings" on public.integration_settings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins read audit logs" on public.audit_logs;
create policy "admins read audit logs" on public.audit_logs for select using (public.is_admin());
drop policy if exists "admins create audit logs" on public.audit_logs;
create policy "admins create audit logs" on public.audit_logs for insert with check (public.is_admin());

drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage variants" on public.product_variants;
create policy "admins manage variants" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage images" on public.product_images;
create policy "admins manage images" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage inventory" on public.inventory;
create policy "admins manage inventory" on public.inventory for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins read profiles" on public.profiles;
create policy "admins read profiles" on public.profiles for select using (public.is_admin() or auth.uid()=id);
drop policy if exists "admins update profiles" on public.profiles;
create policy "admins update profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins read addresses" on public.addresses;
create policy "admins read addresses" on public.addresses for select using (public.is_admin() or auth.uid()=user_id);
drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage order items" on public.order_items;
create policy "admins manage order items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage order addresses" on public.order_addresses;
create policy "admins manage order addresses" on public.order_addresses for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage payments" on public.payments;
create policy "admins manage payments" on public.payments for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage shipments" on public.shipments;
create policy "admins manage shipments" on public.shipments for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage invoices" on public.invoices;
create policy "admins manage invoices" on public.invoices for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id,name,public) values ('product-media','product-media',true)
on conflict (id) do update set public=true;
drop policy if exists "public read product media" on storage.objects;
create policy "public read product media" on storage.objects for select using (bucket_id='product-media');
drop policy if exists "admins upload product media" on storage.objects;
create policy "admins upload product media" on storage.objects for insert with check (bucket_id='product-media' and public.is_admin());
drop policy if exists "admins update product media" on storage.objects;
create policy "admins update product media" on storage.objects for update using (bucket_id='product-media' and public.is_admin()) with check (bucket_id='product-media' and public.is_admin());
drop policy if exists "admins delete product media" on storage.objects;
create policy "admins delete product media" on storage.objects for delete using (bucket_id='product-media' and public.is_admin());

insert into public.integration_settings (provider,status) values
('payment','waiting_provider'),('basitkargo','waiting_credentials'),('nes_portal','waiting_credentials')
on conflict (provider) do nothing;

insert into public.site_settings (key,value) values
('seo',jsonb_build_object('siteName','Elmas Triko','defaultTitle','Elmas Triko | Kadın & Erkek Triko','defaultDescription','Elmas Triko kadın ve erkek koleksiyonları. Yeni sezon triko, hırka, kazak ve zamansız parçalar.')),
('commerce',jsonb_build_object('freeShippingThreshold',5000,'shippingFee',149,'currency','TRY'))
on conflict (key) do nothing;


create or replace function public.track_store_order(p_order_no text, p_email text)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  o public.orders%rowtype;
  items jsonb;
  shipment jsonb;
begin
  select * into o from public.orders
  where lower(order_no)=lower(trim(p_order_no))
    and lower(coalesce(guest_email,''))=lower(trim(p_email))
  limit 1;
  if o.id is null then return null; end if;

  select coalesce(jsonb_agg(jsonb_build_object('name',product_name,'sku',sku,'color',color,'size',size,'quantity',quantity,'unitPrice',unit_price,'lineTotal',line_total)),'[]'::jsonb)
  into items from public.order_items where order_id=o.id;

  select jsonb_build_object('provider',provider,'trackingCode',tracking_code,'trackingUrl',tracking_url,'status',status)
  into shipment from public.shipments where order_id=o.id order by created_at desc limit 1;

  return jsonb_build_object('orderNo',o.order_no,'status',o.status,'paymentStatus',o.payment_status,'grandTotal',o.grand_total,'currency',o.currency,'createdAt',o.created_at,'items',items,'shipment',shipment);
end; $$;
revoke all on function public.track_store_order(text,text) from public;
grant execute on function public.track_store_order(text,text) to anon,authenticated;


create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  is_active boolean not null default true,
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','resolved','spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;
drop policy if exists "public subscribe newsletter" on public.newsletter_subscribers;
drop policy if exists "admins manage newsletter" on public.newsletter_subscribers;
create policy "admins manage newsletter" on public.newsletter_subscribers for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public send contact message" on public.contact_messages;
drop policy if exists "admins manage contact messages" on public.contact_messages;
create policy "admins manage contact messages" on public.contact_messages for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.subscribe_newsletter(p_email text)
returns boolean language plpgsql security definer set search_path=public,auth as $$
declare v_email text:=lower(trim(coalesce(p_email,'')));
begin
  if length(v_email)>254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email'; end if;
  insert into public.newsletter_subscribers(email,is_active,source,updated_at) values(v_email,true,'website',now())
  on conflict(email) do update set is_active=true,updated_at=now();
  return true;
end $$;
revoke all on function public.subscribe_newsletter(text) from public;
grant execute on function public.subscribe_newsletter(text) to anon,authenticated;

create or replace function public.submit_contact_message(p_name text,p_email text,p_phone text,p_subject text,p_message text)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_id uuid; v_email text:=lower(trim(coalesce(p_email,''))); v_name text:=trim(coalesce(p_name,'')); v_message text:=trim(coalesce(p_message,''));
begin
  if length(v_name)<2 or length(v_name)>120 then raise exception 'invalid_name'; end if;
  if length(v_email)>254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email'; end if;
  if length(v_message)<5 or length(v_message)>5000 then raise exception 'invalid_message'; end if;
  if exists(select 1 from public.contact_messages where email=v_email and created_at>now()-interval '2 minutes') then raise exception 'rate_limited'; end if;
  insert into public.contact_messages(name,email,phone,subject,message) values(v_name,v_email,nullif(left(trim(coalesce(p_phone,'')),40),''),nullif(left(trim(coalesce(p_subject,'')),160),''),v_message) returning id into v_id;
  return v_id;
end $$;
revoke all on function public.submit_contact_message(text,text,text,text,text) from public;
grant execute on function public.submit_contact_message(text,text,text,text,text) to anon,authenticated;

commit;
