-- Password-only access to influencer resources. Existing customer authentication stays unchanged.
-- Idempotent and additive: does not touch orders, products, payments or partner balances.
BEGIN;

create or replace function public.influencer_password_auth()
returns boolean language sql stable set search_path=public,auth as $fn$
  select coalesce(auth.jwt()->'amr' @> '[{"method":"password"}]'::jsonb,false);
$fn$;
revoke all on function public.influencer_password_auth() from public;
grant execute on function public.influencer_password_auth() to authenticated;

alter policy influencers_self_read on public.influencers to authenticated using (
 public.influencer_password_auth() and status='active' and
 user_id=auth.uid() and lower(email)=lower(coalesce(auth.jwt()->>'email',''))
);
alter policy influencer_orders_self_read on public.influencer_orders to authenticated using (
 public.influencer_password_auth() and exists(select 1 from public.influencers i
 where i.id=influencer_id and i.status='active' and i.user_id=auth.uid()
 and lower(i.email)=lower(coalesce(auth.jwt()->>'email','')))
);
alter policy influencer_requests_self_read on public.influencer_payout_requests to authenticated using (
 public.influencer_password_auth() and exists(select 1 from public.influencers i
 where i.id=influencer_id and i.status='active' and i.user_id=auth.uid()
 and lower(i.email)=lower(coalesce(auth.jwt()->>'email','')))
);

create or replace function public.claim_influencer_access()
returns uuid language plpgsql security definer set search_path=public,auth as $fn$
declare v_id uuid; v_user auth.users%rowtype;
begin
 if not public.influencer_password_auth() then raise exception 'password_auth_required'; end if;
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 select * into v_user from auth.users where id=auth.uid();
 if v_user.email_confirmed_at is null then raise exception 'email_not_confirmed'; end if;
 select i.id into v_id from public.influencers i
  where i.status='active' and lower(i.email)=lower(v_user.email)
    and (i.user_id is null or i.user_id=auth.uid())
  for update;
 if v_id is null then raise exception 'influencer_not_authorized'; end if;
 update public.influencers set user_id=auth.uid(),updated_at=now() where id=v_id;
 return v_id;
end;
$fn$;

create or replace function public.influencer_request_payout()
returns jsonb language plpgsql security definer set search_path=public,auth as $fn$
declare v_id uuid; v_user auth.users%rowtype; v_earned numeric(12,2); v_taken numeric(12,2); v_available numeric(12,2); v_request uuid;
begin
 if not public.influencer_password_auth() then raise exception 'password_auth_required'; end if;
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 select * into v_user from auth.users where id=auth.uid();
 if v_user.email_confirmed_at is null then raise exception 'email_not_confirmed'; end if;
 select id into v_id from public.influencers where user_id=auth.uid() and lower(email)=lower(v_user.email) and status='active' for update;
 if v_id is null then raise exception 'influencer_not_authorized'; end if;
 select coalesce(sum(a.commission_amount),0) into v_earned
 from public.influencer_orders a join public.orders o on o.id=a.order_id
 where a.influencer_id=v_id and o.payment_status='paid' and o.status='delivered'
 and o.delivered_at is not null and o.delivered_at<=now()-interval '14 days';
 select coalesce(sum(amount),0) into v_taken from public.influencer_payout_requests
 where influencer_id=v_id and status in ('pending','paid');
 v_available := round(v_earned-v_taken,2);
 if v_available<1000 then raise exception 'minimum_payout_1000'; end if;
 insert into public.influencer_payout_requests(influencer_id,amount) values(v_id,v_available) returning id into v_request;
 return jsonb_build_object('id',v_request,'amount',v_available,'status','pending');
end;
$fn$;

COMMIT;
