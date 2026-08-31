# SECURITY.md

## Secrets

- All secrets live in environment variables, never in code or Git
  (`.env` is gitignored; only `.env.example` with placeholder values is
  committed).
- The server refuses to start if `JWT_SECRET` is unset (`backend/src/server.ts`)
  rather than falling back to an insecure default.
- Admin passwords are hashed with argon2id (`backend/src/auth/index.ts`) —
  never stored or logged in plaintext. The seed script requires
  `SEED_ADMIN_PASSWORD` to be explicitly provided; there is no hardcoded
  default credential anywhere in the codebase.
- Bybit API key/secret are only needed for authenticated endpoints (not used
  in this v1, which only calls public ticker/kline endpoints) and are never
  sent to the frontend.

## Authentication & authorization

- Public API requires no auth by design (spec section 79).
- Every admin route is gated server-side by `requireAdmin`, which verifies a
  JWT — either from the httpOnly session cookie or an `Authorization: Bearer`
  header. The frontend's admin UI never decides authorization on its own;
  it just doesn't render admin-only affordances for a logged-out user. A
  request that skips the UI and hits the API directly still gets rejected
  server-side.
- Cookies are set `httpOnly`, `sameSite: lax`, and `secure` in production.

## Rate limiting

Not yet implemented as middleware in this pass — flagged as a follow-up.
The market-data-service's shared cache already prevents the specific abuse
case the spec calls out (one Bybit call per visitor); a general API rate
limiter (e.g. `@fastify/rate-limit`) should be added before public launch.

## Error handling

Errors are never masked server-side — the full error (with stack trace) is
logged via Fastify's logger. What's returned to the client is a generic
message in production and the real message in development, so internal
details (stack traces, query text, connection strings) never leak to end
users (spec section 85).

## Input validation

Admin write endpoints validate their body with `zod` (see
`backend/src/api/admin/routes.ts`) and reject malformed requests with a 400
before touching the database.

## Data integrity

- `TradeEvent` rows are append-only — nothing in the codebase issues a
  `DELETE` or `UPDATE` against that table.
- Immutable trade fields can only change through `trade-engine.applyAdminEdit`,
  which always writes an audit trail alongside the change.
