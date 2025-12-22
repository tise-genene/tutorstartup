# Roadmap (Production-ready to 1M+ users)

This roadmap assumes we keep a **modular monolith** in `apps/api` initially and grow capabilities in a sequence that reduces risk.

## Phase 0 (0–2 weeks): Foundations that prevent fires

### Engineering deliverables

- API: add Prisma integration (PrismaService), global validation, error handling, and config validation
- API: add health endpoints (`/health`, `/ready`) and graceful shutdown
- API: add structured logging + request id (correlation)
- API: add rate limiting + CORS policy + security headers
- API: add OpenAPI docs and versioned routing (`/api/v1`)
- Repo: add docker-compose for local dev (postgres + redis + meilisearch)
- CI: add GitHub Actions (lint, test, build) for each app + turbo cache

### Product-critical MVP slice (thin vertical)

- Auth: register/login + refresh tokens (or choose an IdP like Cognito)
- Users: create/read profile
- Tutors: create/update tutor profile
- Web: minimal pages to exercise these flows against the API

### Exit criteria

- `pnpm build` is green on CI
- API has health checks and returns structured logs
- Migrations run cleanly in fresh DB
- Basic auth + tutor CRUD working end-to-end

## Phase 1 (2–6 weeks): Features with operational readiness

### Reliability & security

- Add request/response schema validation and consistent error shape
- Add audit logging for sensitive actions
- Add secrets management plan for prod (no raw `.env`)
- Add basic abuse protections: rate-limit tiers, captcha hooks, account lockouts

### Scale enablers

- Redis caching layer for hot reads
- Background jobs (BullMQ):
  - email/push notifications
  - search indexing
  - webhook processing
- Search indexing (Meilisearch) for tutor discovery
- File uploads: S3 presigned URLs + async virus scanning pipeline

### Exit criteria

- Queue workers run reliably and are observable
- Search works with eventual consistency (indexing pipeline)
- Upload flow is safe and doesn’t block API request threads

## Phase 2 (6–12 weeks): Hardening for 1M+ users

### Performance

- DB indexing and query review for top endpoints
- Cursor pagination everywhere
- Connection pooling strategy (RDS Proxy/PgBouncer)
- Read replica (if read-heavy)

### Operability

- OpenTelemetry tracing + dashboards + alerts
- SLOs and error budgets for core APIs
- Load testing + capacity planning baseline
- Runbooks + incident response checklist

### Architecture evolution (only if needed)

- Split workers out first (search, notifications, payments-webhooks)
- Add event outbox pattern for reliable async publishing

### Exit criteria

- Defined SLOs with alerting
- Load test results + target capacity numbers
- Disaster recovery practice: restore from backup

## Open questions (answer early)

- Auth model: in-house JWT vs Cognito/Clerk/Auth0?
- Multi-region requirement? (usually no for v1)
- Payment compliance + reconciliation requirements?
- Real-time truly required, or can we poll?
