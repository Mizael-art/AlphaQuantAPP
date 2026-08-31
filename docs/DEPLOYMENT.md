# DEPLOYMENT.md

## Target topology (spec section 7)

| Component | Target |
|---|---|
| Frontend | Vercel |
| Backend API | Render (or equivalent) |
| Worker (monitoring + performance) | Render background worker (separate service from the API — it must keep running independent of HTTP traffic) |
| Database | Supabase Postgres or Render Postgres |

## Frontend (Vercel)

1. Import the `frontend/` directory as the project root.
2. Build command: `npm run build`. Output directory: `dist`.
3. Environment variable: `VITE_API_URL` = your deployed backend URL.

## Backend API (Render)

1. New Web Service, root directory `backend/`.
2. Build command: `npm install && npx prisma generate && npm run build`.
3. Start command: `npm start`.
4. Environment variables: everything in `.env.example` except the
   frontend-only `VITE_*` ones. `DATABASE_URL` points at your managed
   Postgres. `JWT_SECRET` must be set — the process exits immediately if
   it's missing (see `backend/src/server.ts`).
5. Run `npx prisma migrate deploy` as a Render "pre-deploy" / one-off job
   before the first deploy, and again after every schema change.

## Worker (Render background worker)

1. New Background Worker, same repo/root directory `backend/`.
2. Build command: same as the API service.
3. Start command: `npm run start:worker`.
4. Same environment variables as the API service (needs `DATABASE_URL`,
   does not need `JWT_SECRET` unless you later add worker-triggered admin
   actions).

## Database (Supabase / Render Postgres)

1. Create the instance, copy the connection string into `DATABASE_URL` on
   both the API and worker services.
2. Enable daily backups / point-in-time recovery in the provider dashboard.
3. Run migrations from a trusted environment (CI or your local machine with
   the production `DATABASE_URL`), never by hand-editing the schema in
   production.

## GitHub

- Protect `main`; require the test workflow (see TESTING.md) to pass before
  merge.
- Never commit `.env` — only `.env.example` is tracked.

## Deployment checklist (spec section 131)

Fill this in per environment before calling a deploy "done":

- [ ] GitHub — repo pushed, `main` protected
- [ ] Vercel — frontend deployed, `VITE_API_URL` set
- [ ] Backend — Render service live, health check passing
- [ ] Database — migrations applied, seed run once, backups enabled
- [ ] Bybit — public REST endpoints reachable from the backend's network
- [ ] WebSocket — N/A in this v1 (documented deviation, see ARCHITECTURE.md)
- [ ] Monitoring — worker service running, `system_health.monitoring = ONLINE`
- [ ] Authentication — admin login works, non-admin routes reject unauthenticated requests
- [ ] Public API — `/api/public/overview` returns real data
- [ ] Admin API — a test call can be created, published, and closed end-to-end
- [ ] Frontend — public + admin pages load against the deployed API
- [ ] Mobile — responsive layout checked at 390px width
- [ ] Tests — `npm test` passing in CI

This checklist could not be executed end-to-end during development (no live
Postgres/Bybit-reachable environment was available in the build sandbox) —
run it against your actual deployment before going live.
