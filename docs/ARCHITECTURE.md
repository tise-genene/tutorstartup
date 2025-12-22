# Architecture (Target for 1M+ users)

This repo is a Turborepo monorepo:

- `apps/web`: Next.js (App Router)
- `apps/api`: NestJS API
- Postgres via Prisma (schema exists, but API wiring is not implemented yet)

This document proposes a pragmatic, production-ready architecture that scales beyond 1M users **without prematurely over-microservicing**.

## Principles

- **Modular monolith first**: keep one API deployable artifact, but enforce strict module boundaries so pieces can later be split into services.
- **Stateless compute**: API and web are horizontally scalable; state lives in Postgres/Redis/object storage.
- **Async-by-default for slow work**: payments, webhooks, notifications, file scanning, and emails run in background jobs.
- **Observability is a feature**: metrics + logs + traces + alerting are required to operate at scale.
- **Security from day 1**: authn/authz, rate limiting, input validation, secrets management, and audit logging.

## Recommended high-level architecture

### Runtime components

- **Web**: Next.js behind CDN (CloudFront / Vercel equivalent). Static and dynamic rendering as needed.
- **API**: NestJS behind an L7 load balancer (ALB). Multiple replicas.
- **Database**: Postgres (AWS RDS) + migrations via Prisma.
- **Cache**: Redis (AWS ElastiCache). Used for caching, sessions/tokens if needed, rate-limits, and queue backing.
- **Queues**: BullMQ (Redis-backed) or SQS-based workers (AWS-native). Start with BullMQ for speed.
- **Search**: Meilisearch as separate service (or OpenSearch later). Keep it behind a small “Search module/service” boundary.
- **Object storage**: S3 for uploads + CloudFront for delivery.
- **Realtime**: Socket.IO with Redis adapter to fan out across replicas (only if realtime is truly required).

### Deployment recommendation (AWS-first)

Keep it simple and robust:

- **ECS Fargate** for `api` (and optional workers) + **ALB**
- **RDS Postgres** + backups + read replica later
- **ElastiCache Redis**
- **S3 + CloudFront** for uploads and CDN
- **ECR** container registry

EKS is viable but increases operational burden; adopt EKS only when platform complexity demands it.

## API design: modular monolith layout

Target modules (NestJS):

- **Auth**: login, refresh, session management, password/OTP, 2FA later
- **Users**: user profile and identity
- **Tutors**: tutor profile + availability
- **Search**: indexing tutors + query
- **Bookings**: booking lifecycle
- **Payments**: Chapa/Telebirr integration + webhook handling
- **Notifications**: email/push in background jobs
- **Uploads**: presigned URL issuance + metadata + scanning pipeline
- **Admin**: internal admin endpoints

Rule: modules talk via **service interfaces** or a small event bus, not by importing internals.

## Data model strategy (Postgres)

Start with Postgres as the source of truth.

### What changes for 1M+ users

- **Indexes and query design matter** more than microservices early.
- Avoid N+1 queries and unbounded list endpoints.
- Use pagination everywhere (cursor-based preferred).
- Prefer immutable append-only tables for audit/event logs.

### Growth tactics

- Add **read replicas** for read-heavy workloads.
- Add **PgBouncer/RDS Proxy** to reduce connection pressure.
- Partition large time-series tables (e.g., events, logs) when necessary.

## Caching strategy (Redis)

Use Redis intentionally:

- **Rate limiting**
- **Hot reads** (e.g., tutor cards, search result fragments)
- **Derived views** with TTL
- **Distributed locks** for idempotency (payments, booking creation)

Anti-pattern: caching entire domain objects without versioning/invalidation strategy.

## Async / job processing

Use queues for:

- payment webhook processing + retries
- email + push notifications
- search indexing
- upload virus scanning
- scheduled jobs (cleanup, reminders)

Requirements:

- idempotent job handlers
- retry policy + dead-letter
- job tracing + metrics

## Payments: correctness over cleverness

- Always build with **idempotency keys** for payment initiation.
- Webhooks must be:
  - authenticated/verified
  - stored durably (raw payload + headers)
  - processed asynchronously
  - safe to replay

## Security baseline

- Centralized config validation (fail fast on boot)
- Input validation (DTOs + pipes)
- Authn: JWT or sessions (decide early); refresh token rotation recommended
- Authz: RBAC (roles already exist in schema)
- Rate limiting + WAF at edge when possible
- Secrets via AWS Secrets Manager/SSM (not `.env` in production)
- Audit log for sensitive actions

## Observability baseline

Minimums for 1M+ operations:

- structured logs with request correlation id
- metrics: request rate, latency p50/p95/p99, error rate, queue depth, DB pool, cache hit rate
- tracing (OpenTelemetry)
- alerting: SLO-based (error budget burn)

## Environment variables reality check

`apps/api/.env.example` lists many integrations (Redis, payments, search, uploads, realtime, Sentry), but the codebase doesn’t implement them yet.

Recommendation:

- Define a **"Supported Now"** env set (only what code uses today)
- Define a **"Planned"** env set (documented but unused)
- Add runtime validation so missing required vars fail at startup

## When to split into microservices

Split only when one is true:

- independent scaling needs (e.g., search indexing, notifications)
- independent failure domains required
- team ownership boundaries justify it

Suggested first split candidates (later):

- **Search worker/service**
- **Notifications worker/service**
- **Payments webhook worker**
