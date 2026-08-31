# ARCHITECTURE.md

## System diagram

```
                      USER
                       |
                       v
                 ALPHAQUANT X
                       |
            +----------+----------+
            |                     |
            v                     v
    frontend/ (public)     frontend/ (admin)
    React + Vite + TS       same app, /admin/* routes, JWT-gated
            |                     |
            +----------+----------+
                       |
                       v
              backend/src/api  (Fastify)
                       |
        +--------------+---------------+
        |              |               |
        v              v               v
  trade-engine   performance-engine  backtest-engine
        |
        v
  monitoring-engine  (separate worker process, backend/src/workers)
        |
        v
  market-data-service (in-memory cache, single Bybit REST client)
        |
        v
       Bybit REST API (v5 tickers + klines)

  All engines read/write through backend/src/db/client.ts (Prisma) ->
  PostgreSQL
```

## Why this stack

- **Frontend stays Vite/React**, not migrated to Next.js, because the
  Figma-exported frontend already worked and the spec explicitly says not to
  migrate technology without necessity.
- **Backend is Node/TypeScript** rather than Python, purely because no
  existing backend was provided to preserve (see the Phase-0 audit in the
  conversation history) — TypeScript end-to-end let the domain model live in
  one place (`shared/types.ts`) and be imported by both apps.
- **Prisma + PostgreSQL** for typed migrations and to satisfy the spec's
  requirement for auditable, non-destructive schema evolution.
- **Fastify** for the API: small, fast, first-class TypeScript + JSON schema
  support, plugin ecosystem for JWT/cookies/CORS.

## Engines

| Engine | Spec sections | Responsibility |
|---|---|---|
| `pnl-engine` | 26-36, 74-75, 104 | Pure functions: notional, price return, P&L, ROI, account impact, R multiple. No I/O. Fully unit-tested against the spec's own sanity tests. |
| `trade-engine` | 12-14, 61-62, 108 | State transitions, immutable-field protection (edits to published entry/stop/TP create `TradeEvent`s instead of overwriting), audit logging. |
| `monitoring-engine` | 21-25 | Runs as a worker loop (not tied to any browser tab). Detects entry/TP/stop by price, not ROI. Documented same-tick ambiguity rule. |
| `market-data-service` | 20, 81-83 | Single shared Bybit REST client with an in-memory TTL cache, so N trades checked in one monitoring tick cost at most 1 Bybit call per symbol, not per trade or per user. |
| `performance-engine` | 43-55, 76, 96 | Pre-aggregated `PerformanceSnapshot` rows (daily/weekly/monthly/all-time) so pages don't recompute full history on every request. Never sums ROI% across trades — returns are capital-delta based. |
| `backtest-engine` | 71-75, 100-101 | Runs against real Bybit historical klines. No lookahead (only past candles inform a decision at index i). Returns `INSUFFICIENT_DATA` honestly rather than fabricating results. |

## Domain model

See `backend/prisma/schema.prisma` for the authoritative schema and
`shared/types.ts` for the TypeScript mirror used by API responses. Both
implement spec sections 10-13 (Trade, TradeEvent, Strategy, Performance
snapshots, Backtest, PaperPosition/Order, SystemHealth, AuditLog).

`TradeEvent` rows are append-only — nothing in the codebase deletes or
updates them, matching the spec's immutability requirement (section 13-14).

## Frontend integration

The frontend pages were originally built (via Figma Make) against a mock
data shape in `frontend/src/data/mockData.ts` (`entry`, `stop`, `tradeRoi`,
`pnl`, `accountImpact`...). Rather than rewrite every page's JSX against the
backend's field names (`entryPrice`, `stopPrice`, `tradeRoiPct`, `pnlUsd`,
`accountImpactPct`...), `frontend/src/lib/mapTrade.ts` adapts one shape to
the other at the API boundary. This was a deliberate choice to minimize the
diff against the delivered Figma export while still being backed by real
data — documented here per the "don't change things silently" rule.

## Known limitations (v1)

These are documented deviations/simplifications, not silent shortcuts:

1. **Market data is REST-polling, not WebSocket.** `market-data-service`
   polls Bybit's REST ticker endpoint on a shared cache (TTL 3s) instead of
   holding a persistent Bybit WebSocket subscription. It still satisfies the
   "one connection, not one per user" requirement. A `BybitWebSocketFeed`
   stub marks the extension point for a v2 upgrade.
2. **Backtest engine supports one strategy shape.** It runs a rolling
   high/low breakout with a fixed R:R stop/target — real data, no lookahead,
   `INSUFFICIENT_DATA` when appropriate — but it is not the full
   strategy-research condition language implied by spec section 70.
3. **Not all frontend pages are wired to the API yet.** Home, LiveCalls,
   OpenTrades, TradeHistory, TradeDetail, AdminLogin, PublishCall,
   AdminDashboard, AdminOpenTrades, and AdminHistory are live. Reports,
   Analytics, Backtest, Strategies, PaperTrading, Settings, and any trading
   terminal page still read from `mockData.ts`. The backend API endpoints
   they'd need (`/api/admin/backtest`, `/api/admin/analytics`,
   `/api/public/reports`) already exist.
4. **Paper trading engine has data models but no order-matching logic yet.**
   `PaperAccount`/`PaperPosition`/`PaperOrder` tables exist; the
   fill/matching engine referenced in spec sections 63-65 is not built.
5. **Notifications (spec section 109) are not a persisted system.** The
   admin dashboard derives simple "approaching TP" alerts live from real
   trade data instead of a stored notification feed.
