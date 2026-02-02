# ADR-0001: Architecture strategy (modular monolith first)

Date: 2025-12-22

## Status

Accepted (proposed as default until revisited)

## Context

We are building a general jobs marketplace with Next.js (`apps/web`) and NestJS (`apps/api`).
We want a **production-ready** system that can scale to **1M+ users**, but the current code is early-stage scaffolding.

At this stage, correctness, speed of iteration, and operational clarity matter more than splitting into many services.

## Decision

We will build a **modular monolith** in `apps/api`:

- One deployable API service initially
- Strict domain module boundaries (Auth, Users, Tutors, Bookings, Payments, Search, Notifications, Uploads)
- Async work via a queue-backed worker component (can be separate process/container later)

We will introduce microservices only when scale/ownership/failure-domain requirements justify it.

## Consequences

### Positive

- Faster product iteration (single deployment unit)
- Easier local dev and debugging
- Clearer data consistency (single DB transaction boundary)

### Negative

- Some modules may compete for resources until separated
- Requires discipline to keep module boundaries clean

## Follow-ups

- Add coding conventions for module boundaries
- Add a queue worker process as a separate entrypoint
- Define service extraction criteria (latency SLOs, deployment frequency, scaling needs)
