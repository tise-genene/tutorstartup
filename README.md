# tutorstartup

Modern jobs marketplace playground powered by a NestJS API (`apps/api`) and a Next.js App Router web client (`apps/web`). The monorepo is managed with Turborepo + pnpm and leans on Redis, BullMQ, and Meilisearch to prove out production-ready workflows. |

## Prerequisites

- Node 20+
- pnpm `npm install -g pnpm`
- Local Postgres + Redis + Meilisearch (see `.env.example` for defaults), or run `docker compose up -d`.

## Getting started

```bash
pnpm install

# Start dependencies
docker compose up -d

# Apply DB migrations
pnpm --filter api exec prisma migrate dev

# pnpm --filter api exec prisma migrate deploy

# API (http://localhost:4000)
pnpm --filter api start:dev

# Web (http://localhost:3000)
pnpm --filter web dev
```

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
