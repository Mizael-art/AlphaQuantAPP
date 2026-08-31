# TESTING.md

## What exists today

`backend/test/pnl-engine.test.ts` — unit tests for the P&L engine,
reproducing the spec's own sanity tests (sections 74/75) verbatim:

- LONG $10,000 capital / $1,000 margin / entry 100 → exit 102, checked at
  1x, 5x, 10x, 50x leverage against the exact P&L/ROI/account-impact figures
  given in the spec.
- SHORT equivalent (entry 100 → exit 98).
- `calcNotional`, `calcRMultiple` (including the "never invent R without a
  stop" rule), and cost application (entry/exit fee + slippage subtracted
  from gross P&L).

Run with:

```bash
cd backend
npm test        # single run
npm run test:watch
```

All 12 tests pass as of this delivery (verified during development — see
the build log in the accompanying conversation).

## What's verified but not executable in this environment

- **TypeScript compiles cleanly** (`npx tsc --noEmit`) for both `backend/`
  and `frontend/`, and `frontend` builds a working production bundle
  (`npx vite build`) — verified during development.
- **Prisma schema** was hand-reviewed for consistency (relations, indexes,
  enums matching `shared/types.ts`) but `prisma generate`/`migrate` could
  not run in the build sandbox (its network policy blocks
  `binaries.prisma.sh`, which Prisma needs for its query engine binary).
  Run `npx prisma generate` and `npx prisma migrate dev` on a machine/CI
  without that restriction before relying on the ORM.
- **No live Postgres or reachable Bybit API** was available in the build
  environment, so integration/E2E tests against a real database and market
  data could not be executed here.

## Recommended test additions (not yet written)

Per spec sections 117-121, a complete test suite should also cover:

- **Integration tests** for each API route against a test database
  (e.g. via `testcontainers` or a scratch Postgres instance) — create call,
  publish, patch, close, cancel; historical trade register + analyze.
- **Monitoring engine tests** using a mocked `market-data-service` (fixed
  price sequences) to assert entry/TP/stop/ambiguity detection without
  hitting the real Bybit API.
- **Backtest engine tests** using a fixture kline series (not live Bybit
  data) to assert the "no lookahead" and "INSUFFICIENT_DATA when too few
  candles" behaviors deterministically.
- **E2E test** following the exact flow in spec section 118: admin login →
  create call → publish → appears on public site → price update → entry hit
  → TP hit → close → history/performance/equity all reflect it. This needs
  a running frontend + backend + database + (mocked or real) market data and
  is best implemented with Playwright once there's a deployed staging
  environment to point it at.

## CI suggestion

A minimal GitHub Actions workflow for this repo:

```yaml
name: CI
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres }
        ports: ["5432:5432"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd backend && npm install && npx prisma generate && npm run build && npm test
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd frontend && npm install && npx tsc --noEmit && npm run build
```
