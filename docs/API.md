# API.md

Base URL: `VITE_API_URL` / `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000`).

## Public API (no auth)

| Method | Path | Description |
|---|---|---|
| GET | `/api/public/overview` | Home page payload: system status, today/week/month/all-time stats, realized/unrealized/total P&L, open trades, equity curve, recent calls |
| GET | `/api/public/open-trades` | All currently open/waiting-entry public trades |
| GET | `/api/public/calls` | Last 100 published calls (any status, including closed/cancelled/ambiguous — never filtered to hide losses) |
| GET | `/api/public/trades?page=&pageSize=&asset=&status=&strategy=` | Paginated trade log |
| GET | `/api/public/trades/:id` | Single trade with full event timeline |
| GET | `/api/public/performance` | Breakdown by asset/strategy/timeframe/direction + recent snapshots |
| GET | `/api/public/reports?period=daily\|weekly\|monthly\|all-time` | Performance snapshot history for a period |
| GET | `/api/health` | System health rows |

## Admin API (JWT required via httpOnly cookie or `Authorization: Bearer`)

| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/login` | `{ email, password }` → sets session cookie, returns token |
| POST | `/api/admin/logout` | Clears session cookie |
| POST | `/api/admin/calls` | Create a call. `{ ...fields, publish?: boolean }` — `publish: true` publishes immediately, otherwise saved as DRAFT |
| PATCH | `/api/admin/calls/:id` | Edit a trade. Changes to immutable fields (entry/stop/TP/direction/strategy/timeframe) create `TradeEvent`s instead of silently overwriting |
| POST | `/api/admin/calls/:id/close` | Manually close at current market price |
| POST | `/api/admin/calls/:id/cancel` | Cancel a call |
| POST | `/api/admin/historical-trades` | Register a historical trade for analysis |
| POST | `/api/admin/historical-trades/:id/analyze` | Walk real Bybit klines to verify entry/TP/stop sequence — returns `VERIFIED` / `PARTIALLY_VERIFIED` / `AMBIGUOUS` / `INSUFFICIENT_DATA` |
| GET | `/api/admin/performance` | Recent performance snapshots |
| GET | `/api/admin/analytics` | Open/closed counts, system health, recent audit log |
| POST | `/api/admin/backtest` | Run a backtest against real historical klines. Body: `{ symbol, timeframe, startMs, endMs, startingCapital, riskPct, leverage, direction, feesPct?, slippagePct? }` |

## Auth model

The frontend never decides who's authorized — every admin route is gated
server-side by `requireAdmin` (spec section 79). The login response sets an
httpOnly cookie; the frontend also keeps a copy in `sessionStorage` and sends
it as `Authorization: Bearer` for environments where the cross-origin cookie
doesn't attach (e.g. some local dev setups). Either credential is accepted;
neither is trusted without server-side JWT verification.

## Errors

Every error response is `{ error: "SOME_CODE", message: "..." }`. In
production, internal error messages are replaced with a generic
"Something went wrong." while the full error is still logged server-side
(spec section 85 — never mask errors, but never leak internals to the
client either).
