# DATABASE.md

PostgreSQL via Prisma. Schema source of truth: `backend/prisma/schema.prisma`.

## Core tables

- **trades** — one row per call/trade. `status` is the state machine (spec
  section 12). Immutable fields (entry/stop/TP/direction/strategy/timeframe)
  are only ever changed through `trade-engine.applyAdminEdit`, which logs a
  `TradeEvent` + `AuditLog` row alongside the update — never a silent
  overwrite.
- **trade_events** — append-only. Never deleted, never updated. This is the
  audit trail referenced throughout the spec (sections 13-14, 108).
- **strategies** — name + optional rules JSON consumed by the backtest
  engine's (currently simple) strategy parser.
- **performance_snapshots** — one row per (period, periodStart). Recomputed
  by the worker every `PERFORMANCE_INTERVAL_MS` (default 5 min). Pages read
  these instead of aggregating the full trade table on every request (spec
  section 76).
- **equity_points** — running equity curve series for the public chart.
- **backtests** / **backtest_trades** — one row per backtest run + its
  individual simulated trades.
- **paper_accounts** / **paper_positions** / **paper_orders** — data model
  for paper trading; see ARCHITECTURE.md limitation #4 for what's not yet
  implemented on top of these tables.
- **system_health** — one row per service (`api`, `database`, `market_data`,
  `monitoring`, `worker`), updated by the worker and surfaced at
  `GET /api/health` and the public overview endpoint.
- **audit_logs** — admin action log (who, when, what changed, old/new value).
- **admin_users** — argon2id password hashes only, never plaintext.

## Indexes

`trades` is indexed on `status`, `asset`, `createdAt`, `publishedAt`,
`closedAt`, `strategyId`, `timeframe` — the columns the public/admin APIs
filter and sort by (spec section 76: avoid N+1 / full scans on every page
load).

## Migrations

Run `npx prisma migrate dev --name <description>` for local schema changes,
`npx prisma migrate deploy` in CI/production. Never run `prisma migrate
reset` against a database with real data — it drops everything. Back up
(`pg_dump`) before any migration that changes or drops a column.

## Seeding

`backend/prisma/seed.ts` creates:
- one `AdminUser` (email/password from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`
  env vars — the script refuses to run without a password, so no default
  credential ever ships)
- an initial equity point at $10,000
- `SystemHealth` rows for all five services, initialized ONLINE
- four starter `Strategy` rows (Breakout, Mean Reversion, Trend Following,
  Liquidity Sweep) — labels only, no rules yet

## Backup

Documented policy (spec section 125): back up before any destructive
migration. For managed Postgres (Supabase/Render), use their built-in daily
backup + point-in-time recovery. For self-hosted, schedule
`pg_dump --format=custom` and store off-instance.
