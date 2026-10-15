# Analytics checks

Run all commands from the repository root. Do not run `local-bootstrap.sql` against Supabase production.

## Date and presentation fixtures

```
node scripts/analytics-qa/range-and-ui.cjs
python3 -m http.server 3112 --bind 127.0.0.1 --directory .qa/ui
npm exec --yes --package=playwright@1.58.2 -- node scripts/analytics-qa/visual.cjs
```

The fixture HTML is explicitly labeled synthetic. Rendering requires the installed React/TypeScript packages and a completed local build for CSS.

## Browser measurement

Start the production build at localhost:3111, then:

```
npm exec --yes --package=playwright@1.58.2 -- node scripts/analytics-qa/browser.cjs
```

Analytics requests are intercepted and never persisted. Google/Meta requests are blocked. No order or payment is submitted. The test deliberately emulates a foreground human browser only inside its isolated context.

## Database

Use the dedicated local container `elmas-analytics-qa-20261015`. Its disposable orders table is a synthetic fixture, not a copy of customer data.

```
docker exec -i elmas-analytics-qa-20261015 psql -U postgres -v ON_ERROR_STOP=1 < scripts/analytics-qa/local-bootstrap.sql
docker exec -i elmas-analytics-qa-20261015 psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20260923_visitor_analytics.sql
docker exec -i elmas-analytics-qa-20261015 psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261015_analytics_funnel.sql
docker exec -i elmas-analytics-qa-20261015 psql -U postgres -v ON_ERROR_STOP=1 < scripts/analytics-qa/database-regression.sql
```

The regression fixture writes are wrapped in a transaction and rolled back. For the live project apply only `20261015_analytics_funnel.sql` after reviewing the migration; never the local bootstrap or fixture script.
