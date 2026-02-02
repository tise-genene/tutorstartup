# Marketplace — Minimum Upwork-like Launch Checklist (Phased)

This is a concrete, **minimum** checklist to reach an Upwork-like marketplace experience for hiring with local payments (Chapa). It’s intentionally scoped to the smallest shippable set that is still coherent and safe.

## Definitions (shared across phases)

- **Client** = Parent/Student who pays.
- **Professional** = Service provider.
- **Job** = A public request posted by a client.
- **Proposal** = A professional’s application to a job.
- **Contract** = A private agreement between client + professional.
- **Ledger** = Immutable record of money movements and balances.
- **Dispute** = A workflow to pause/resolve/refund a payment.

## Phase 0 — Hardening + “Don’t get hacked” (Ship first)

### Checklist

- [ ] Enforce role checks in API for all sensitive reads/writes (no UI-only gating).
- [ ] Validate and constrain all user-supplied URLs rendered as links (allow only `https://`).
- [ ] Remove direct email exposure between parties until a contract exists (privacy).
- [ ] Rate-limit auth and high-volume endpoints; lock down CSRF expectations for refresh/logout.
- [ ] Add audit logs for critical events: login, job posted, proposal submitted, contract created, payment status change, dispute opened.

### Acceptance criteria

- Posting proposals / tutor responses rejects non-HTTPS links.
- A tutor cannot view another tutor’s proposals/contracts; a parent cannot view another parent’s jobs/contracts.
- No page reveals counterparty email by default (except admin).

## Phase 1 — Marketplace Core (Jobs → Proposals → Hire)

### Deliverables

1. **Job lifecycle**

- Create job (client)
- List open jobs (tutor)
- Close job (client)

2. **Proposal lifecycle**

- Submit proposal (tutor)
- Client can accept/decline (client)
- Tutor can withdraw (tutor)

3. **Contract creation**

- Accepting a proposal creates a Contract (and closes the Job by default).

### Required pages (minimum)

- Client: My Jobs (already), Job detail with proposals (already), **Accept/Decline buttons** (missing)
- Tutor: Find Work (already), Job detail + submit proposal (already), My proposals (already)
- Both: **My Contracts** (missing), Contract detail (missing)

### Acceptance criteria

- Client can accept a proposal; tutor sees contract created.
- Accepted proposal cannot be edited by other tutors; job is no longer visible in “open jobs”.
- Contract has a clear status: `ACTIVE`, `COMPLETED`, `CANCELLED`.

## Phase 2 — Payments v1 (Chapa) + Ledger (Escrow-light)

### Deliverables

1. **Ledger model** (immutable)

- Ledger entries for: client charge, platform fee, tutor payable, tutor payout, refunds.

2. **Chapa integration (minimum)**

- Create payment intent (client → platform)
- Redirect client to Chapa checkout
- Receive webhook(s) and mark payment succeeded/failed
- Idempotency keys: replaying webhook does not double-credit

3. **Attach payments to contracts**

- Contract can require payment before becoming `ACTIVE` OR pay-per-session (choose one and standardize).

### Required pages (minimum)

- Contract detail shows payment status + “Pay” button (client)
- Payment success/failure return pages (client)

### Acceptance criteria

- Given a contract with amount X, paying via Chapa results in:
  - A persisted payment record with provider reference
  - At least 2 ledger entries: client debit, platform credit
  - Contract status updates per rule (e.g., `ACTIVE` after success)
- Webhook replay does not duplicate ledger entries (idempotent).

## Phase 3 — Messaging v1 (In-platform chat)

### Deliverables

- Thread per Contract (and optionally per Job before hire)
- Messages: text + optional attachment URL
- Read/unread per user
- Basic moderation hooks (report message, block user)

### Required pages (minimum)

- Inbox/Threads list
- Thread detail

### Acceptance criteria

- Both parties can message only if they share a Contract (or explicitly allowed pre-contract).
- Messages are not lost and are ordered, paginated, and secured.

## Phase 4 — Reviews + Reputation

### Deliverables

- Review model linked to Contract
- One review per side per contract (or client-only first)
- Aggregate rating on tutor profile (denormalized periodically)

### Required pages (minimum)

- “Leave review” on completed contract
- Show rating breakdown on tutor profile

### Acceptance criteria

- Review can only be created after contract completion.
- Tutor profile displays average rating and count.

## Phase 5 — Disputes + Refunds

### Deliverables

- Dispute open/close workflow
- Freeze contract while disputed
- Refund action updates ledger and payment records
- Admin-only resolution endpoints

### Required pages (minimum)

- “Open dispute” on contract
- Admin dispute queue

### Acceptance criteria

- Dispute prevents payout until resolved.
- Refund produces ledger entries that reconcile balances.

## Phase 6 — Admin minimum console (operational)

### Deliverables

- Admin can:
  - impersonate/disable users (or at least deactivate)
  - view jobs/proposals/contracts
  - view payments + webhooks + disputes
  - resolve disputes

### Acceptance criteria

- Admin can resolve a dispute and issue a refund safely and idempotently.

---

## Implementation notes (recommended defaults)

- Prefer **contract-based access control**: nearly everything sensitive is scoped by contract membership.
- Keep money movement **append-only** in the ledger.
- Treat webhooks as hostile input: verify signature, validate schema, enforce idempotency.
