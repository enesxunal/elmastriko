begin;

alter table public.shipments
  add column if not exists provider_reference text;

create index if not exists shipments_provider_reference_idx
  on public.shipments(provider_reference);

insert into public.integration_settings (provider, status, is_enabled, public_config)
values
  ('tosla', 'waiting_credentials', false, '{"note":"Tosla Isim / AKOde POS altyapisi hazir; merchant bilgileri bekleniyor."}'::jsonb)
on conflict (provider) do update
set status = case
  when public.integration_settings.status = 'configured' then public.integration_settings.status
  else 'waiting_credentials'
end,
public_config = coalesce(public.integration_settings.public_config, '{}'::jsonb)
  || '{"note":"Tosla Isim / AKOde POS altyapisi hazir; merchant bilgileri bekleniyor."}'::jsonb,
updated_at = now();

update public.integration_settings
set status = 'waiting_credentials',
    is_enabled = false,
    public_config = coalesce(public_config, '{}'::jsonb)
      || '{"note":"BasitKargo API istemcisi, barkod olusturma ve webhook altyapisi hazir; token/adres/marka bilgileri bekleniyor."}'::jsonb,
    updated_at = now()
where provider = 'basitkargo';

delete from public.integration_settings
where provider = 'payment'
  and exists (select 1 from public.integration_settings where provider = 'tosla');

commit;
