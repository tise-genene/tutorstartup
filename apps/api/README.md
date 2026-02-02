# API (apps/api)

NestJS 11 modular monolith powering authentication, marketplace workflows, search, and async jobs.

## Modules

- **Auth**: JWT auth, refresh tokens, /v1/auth/\* endpoints.
- **Notifications**: BullMQ queue (with in-memory fallback) that currently logs welcome emails.
- **Profiles (Tutors module)**: CRUD helpers for service provider profiles plus DTO validation.
- **Search**: Redis cache + Meilisearch client, queue factory for sync jobs, /v1/tutors/search endpoint (kept for compatibility).
- **Health**: /health/live and /health/ready monitor DB, Redis, and queue connectivity.
- **Jobs**: Client job posts + professional proposals (marketplace).

## Environment

See .env.example; notable entries:

| Variable                                  | Description                                               |
| ----------------------------------------- | --------------------------------------------------------- |
| DATABASE_URL                              | Postgres connection string                                |
| REDIS_URL                                 | Redis connection URI (cache + BullMQ)                     |
| MEILISEARCH_HOST / MEILISEARCH_MASTER_KEY | Search driver settings; leave blank to run in memory mode |
| QUEUE_DRIVER                              | redis (default) or memory for inline execution            |
| SEARCH_SYNC_ENABLED                       | Toggle queue-driven indexing                              |
| CACHE_DEFAULT_TTL                         | Seconds cached search results stay in Redis               |

## Local scripts

```
# Install deps
pnpm install

# Run API (watch mode)
pnpm --filter api start:dev

# Build for production (tsc)
pnpm --filter api build

# Jest unit/integration suite
pnpm --filter api test

# Prisma client generation
pnpm --filter api prisma generate

# Create/update admin user (reads env vars; idempotent)
pnpm --filter api prisma:seed
```

## Admin login credentials

Admin accounts are created via Prisma seed (not self-registration).

Set these env vars in `apps/api/.env.local` (or your environment):

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME` (optional)

Then run:

```
pnpm --filter api prisma:seed
```

## Testing notes

- Unit specs live next to their services (search-cache.service.spec.ts, search-queue.service.spec.ts, search.controller.spec.ts). They mock Redis/BullMQ to cover cache normalization, queue fallbacks, and controller behavior.
- E2E coverage in test/app.e2e-spec.ts verifies Nest wiring and core endpoints.

## Queue and worker model

- QueueModule centralizes queue factories, health checks, and processors.
- Search indexing and notifications workers are bootstrapped inside the main process for dev; production deployments can split them into dedicated worker pods using the same modules.
- When QUEUE_DRIVER=memory, BullMQ calls shortcut into synchronous handlers so dev/test environments can run without Redis.

## Search pipeline

1. Tutors update their profile (PUT /v1/tutors/me).
2. TutorsService enqueues a search sync job through SearchIndexQueueService.
3. If queues run in memory, the job executes inline; otherwise BullMQ workers push data to Meilisearch.
4. /v1/tutors/search first checks Redis; misses call Meilisearch and cache the normalized payload for ~45 seconds (configurable).
