-- Requires the atomic stock migration first. This job has no external side effects.
begin;
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('elmas-release-expired-stock','* * * * *','select public.release_expired_stock_reservations();');
commit;
