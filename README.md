# ALPHAQUANT X

Quantitative trading intelligence platform — live track record, trade journal,
performance dashboard, and research tools. **Not a brokerage.** No real orders
are ever placed; every operation is SIMULATED, PAPER TRADE, or HISTORICAL and
is labelled as such throughout the UI.

## Monorepo layout

```
alphaquant/
  frontend/    React 19 + Vite + TypeScript + Tailwind (public + admin UI)
  backend/     Node.js + TypeScript + Fastify + Prisma (API, engines, worker)
  shared/      TypeScript types shared by both apps
  database/    seed helpers, backup notes
  docs/        ARCHITECTURE.md, API.md, DATABASE.md, DEPLOYMENT.md,
               SECURITY.md, TESTING.md
```

## Prerequisites

- Node.js 20+
- A PostgreSQL 14+ database (local, Supabase, or Render Postgres)

## Local development

### 1. Clone and install

```bash
cd alphaquant
cp .env.example backend/.env
cp .env.example frontend/.env   # Vite only reads VITE_-prefixed vars from this file
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

Edit `backend/.env`:
- `DATABASE_URL` — your Postgres connection string
- `JWT_SECRET` — a long random string (the server refuses to start without one)
- Leave `BYBIT_API_KEY`/`BYBIT_API_SECRET` empty unless you need authenticated
  Bybit endpoints — public market data (tickers, klines) doesn't require them

Edit `frontend/.env`:
- `VITE_API_URL` — where the backend is running, e.g. `http://localhost:4000`

### 3. Database

```bash
cd backend
npx prisma migrate dev --name init   # creates tables
SEED_ADMIN_EMAIL=admin@alphaquant.local SEED_ADMIN_PASSWORD=<choose-one> npm run prisma:seed
```

> **Note on this delivery:** `prisma generate`/`migrate` could not be executed
> inside the sandbox this project was built in — its network policy blocks
> `binaries.prisma.sh`, which Prisma needs to download its query engine.
> The schema itself was validated by hand and the rest of the backend
> typechecks cleanly against it. Run the commands above on your own machine
> or CI (where that domain isn't blocked) before first use.

### 4. Run everything

```bash
# Terminal 1 — API server
cd backend && npm run dev

# Terminal 2 — monitoring + performance worker (must run independently of the frontend)
cd backend && npm run worker

# Terminal 3 — frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173 · Backend: http://localhost:4000 · Admin: http://localhost:5173/admin/login

### 5. Run tests

```bash
cd backend && npm test
```

This runs the P&L engine unit tests, including the exact LONG/SHORT sanity
tests specified in the project brief (10,000 starting capital, 1x/5x/10x/50x
leverage checks).

## What's real vs. what's a documented v1 simplification

See `docs/ARCHITECTURE.md` → "Known limitations" for the full list. In short:
market data is REST-polling based (not a persistent Bybit WebSocket yet), and
the backtest engine's strategy-rule support is a single breakout model, not
the full strategy-research condition language. Both are flagged in code
comments at their extension points, not silently simplified.

## Deployment

See `docs/DEPLOYMENT.md`.
