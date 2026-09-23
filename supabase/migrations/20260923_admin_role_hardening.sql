begin;

insert into public.profiles (id, full_name, email, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name',''),
  u.email,
  'admin'
from auth.users u
where lower(u.email)=lower('admin@elmastriko.com')
on conflict (id) do update
set email=excluded.email,
    role='admin',
    updated_at=now();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path=public,auth
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role_change_forbidden';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update of role on public.profiles
for each row
execute function public.protect_profile_role();

commit;

select id,email,role
from public.profiles
where lower(email)=lower('admin@elmastriko.com');
