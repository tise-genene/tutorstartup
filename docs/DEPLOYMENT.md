# Deployment runbook

This repo is a pnpm + Turborepo monorepo:

- API: `apps/api` (NestJS + Prisma)
- Web: `apps/web` (Next.js)

## Render

For a step-by-step private beta deployment on Render, see `docs/RENDER.md`.

## 1) Start dependencies (recommended for staging)

From repo root:

```bash
docker compose up -d
```

This starts:

- Postgres on `localhost:5432`
- Redis on `localhost:6379`
- Meilisearch on `localhost:7700`

## 2) Configure environment

Copy and edit env files:

- API: `apps/api/.env` (start from `apps/api/.env.example`)
- Web: `apps/web/.env.local` (start from `apps/web/.env.example`)

Minimum required for API startup:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

If you want distributed rate limiting:

- `RATE_LIMIT_DRIVER=redis`

If running behind a reverse proxy/load balancer:

- Set `TRUST_PROXY=1` (or higher if you have multiple hops) so `req.ip` and other proxy-derived fields are correct.

CSRF (cookie-based refresh/logout):

- `AUTH_CSRF_ENABLED=true` is recommended in production.
- Ensure `FRONTEND_URL` lists the exact allowed frontend origins (comma-separated).

Session cleanup (worker-only):

- Runs only when `PROCESS_ROLE=worker` (or `all`).
- Controlled by `SESSION_CLEANUP_ENABLED`, `SESSION_CLEANUP_INTERVAL_MINUTES`, `SESSION_CLEANUP_RETENTION_DAYS`.

## 3) Apply database migrations

Local/dev (creates & applies migrations):

```bash
pnpm --filter api exec prisma migrate dev
```

Staging/production (applies existing migrations):

```bash
pnpm --filter api exec prisma migrate deploy
```

## 4) Build + run

API:

```bash
pnpm --filter api build
pnpm --filter api start:prod
```

Worker (optional, for BullMQ-driven tasks when `QUEUE_DRIVER=redis`):

```bash
pnpm --filter api start:worker
```

Web:

```bash
pnpm --filter web build
pnpm --filter web start
```

## 5) Health checks

- Liveness: `GET /health/live`
- Readiness: `GET /health/ready`

If Redis/queue/search are configured as `memory`, readiness will report them as `disabled`.
