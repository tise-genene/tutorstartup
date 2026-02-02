# tutorstartup

Modern jobs marketplace playground powered by a NestJS API (`apps/api`) and a Next.js App Router web client (`apps/web`). The monorepo is managed with Turborepo + pnpm and leans on Redis, BullMQ, and Meilisearch to prove out production-ready workflows.

## Highlights

- **Auth & notifications** – Sign-up/login endpoints with JWTs plus a welcome-email BullMQ queue (notifications execute inline when the queue driver is disabled).
- **Profiles module** – Service providers can upsert profiles (bio, skills, rate, etc.) that automatically enqueue Meilisearch sync jobs.
- **Search pipeline** – Redis-backed cache in front of Meilisearch (API currently exposes a `/v1/tutors/search` route for compatibility) including health hooks and queue coverage tests.
- **Frontend wiring** – The landing page in `apps/web` now talks directly to the API for auth, profile CRUD, and search so the entire slice can be demoed without Postman.

## Repo layout

| Path       | Purpose                                                         |
| ---------- | --------------------------------------------------------------- |
| `apps/api` | NestJS modular monolith (Prisma, Redis, BullMQ, Meilisearch).   |
| `apps/web` | Next.js App Router client with Tailwind + custom design tokens. |
| `docs/`    | Architecture notes, roadmap, ADRs.                              |

## Prerequisites

- Node 20+
- pnpm `npm install -g pnpm`
- Local Postgres + Redis + Meilisearch (see `.env.example` for defaults), or run `docker compose up -d`.

## Getting started

```bash
pnpm install

# Start dependencies (Postgres + Redis + Meilisearch)
docker compose up -d

# Apply DB migrations
# - Local/dev: creates & applies migrations
pnpm --filter api exec prisma migrate dev
# - Staging/prod: applies existing migrations
# pnpm --filter api exec prisma migrate deploy

# API (http://localhost:4000)
pnpm --filter api start:dev

# Web (http://localhost:3000)
pnpm --filter web dev
```

Environment variables live in `.env.example` and `apps/api/.env.example`. The web client reads `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000/api`).

See `docs/DEPLOYMENT.md` for a staging/prod runbook.

## Testing & quality gates

```bash
# API unit + integration tests (includes search cache/queue coverage)
pnpm --filter api test

# Type-check + build API bundle
pnpm --filter api build
```

Front-end wiring relies on live API responses, so the recommended way to verify UX changes is to run both dev servers.

## License

MIT
