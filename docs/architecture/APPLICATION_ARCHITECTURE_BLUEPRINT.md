# Application Architecture Blueprint

Date: 2026-03-09
Scope: Entire ExpectedEstate application

## 1. Executive Summary

Current architecture style is a **modular monolith with layered modules**:
- Frontend SPA (React + route guards + centralized API client).
- Backend API gateway (`server/index.ts`) mounting domain route modules.
- Service layer per domain, shared PostgreSQL via Prisma.
- Some event-driven behavior (in-process emitter), webhook integration, and scheduled jobs.

This is a good base. It is **not a full Saga architecture today**.

Target architecture should be:
- **Contract-driven modular monolith**
- **State-machine domain modeling**
- **Durable async workflows via Outbox + workers**
- **Saga orchestration only for long-running, cross-domain, compensating flows**

## 2. Architecture Principles We Should Apply Everywhere

1. **Single owner per domain capability**
Each feature has one owning module for writes and invariants.

2. **Command/Query separation**
Commands mutate state. Queries do not.

3. **State-machine first**
Critical flows are modeled with explicit statuses and legal transitions.

4. **Idempotency by default**
All external-triggered writes (webhooks, retries, admin replay) must be safe to replay.

5. **Fail closed for legal/financial operations**
If uncertain, block action and require explicit recovery path.

6. **Durable async for side effects**
Never rely on in-memory events for money/legal-critical side effects.

7. **Traceability and auditability**
Every action should be explainable by correlation ID, actor, and event history.

## 3. Current Architecture Baseline

## 3.1 Frontend
- React SPA with route-level RBAC and guards.
- Central API client (`src/lib/api.ts`) with shared error parsing and auth header logic.
- Domain pages for executor, advisor, and admin use cases.

## 3.2 Backend
- One API process exposing many domain route modules.
- Route -> service pattern is present in many areas.
- Some routes still contain orchestration/business logic and direct DB usage.

## 3.3 Data
- Shared relational model with strong enums and status fields.
- Good state representation for booking/payment/refund/dispute flows.

## 3.4 Async and Failures
- Stripe webhooks handled server-side.
- Scheduled maintenance job for booking completion and payout release.
- In-process domain events exist, but they are non-durable.

## 4. Recommended Target Style

Use a **Modular Monolith + Durable Workflow Architecture**:

- Keep single deploy/runtime for now.
- Enforce strict module boundaries and ownership.
- Introduce a durable event backbone in the same DB first.
- Add workflow orchestration for only the cross-domain, multi-step flows.
- Postpone microservices until contracts and workflows stabilize.

## 5. Bounded Contexts and Ownership

| Context | Owns | Key Commands | Key Events |
|---|---|---|---|
| Identity & Access | users, auth, role policy | register, login, refresh, logout | UserRegistered, RoleChanged |
| Estate Lifecycle & Authority | estate profile, authority transitions | update estate intake, pin authority | EstateUpdated, AuthorityChanged |
| Roadmap & SSOT | rulesets, roadmap snapshots, versioning | regenerate roadmap, pin/repin | RoadmapGenerated, RoadmapPinned |
| Assets & Liabilities | asset/liability records and statuses | create/update/delete asset/liability | AssetChanged, LiabilityChanged |
| Forms & PDF | template selection, autofill, generation | generate draft, preview, finalize | PdfGenerated, PdfFailed |
| Advisor Marketplace | advisor profile, availability, booking lifecycle | request/confirm/reschedule/cancel booking | BookingRequested, BookingConfirmed, BookingCompleted |
| Payments & Escrow | payment intent, escrow state, payout release | create payment, capture, release payout, refund | PaymentSucceeded, EscrowReleased, PayoutFailed |
| Collaboration & Comms | inbox, chat, follow-ups, outbound comm logs | send message, create follow-up | MessageSent, FollowUpCreated |
| Admin & Governance | approvals, QA, audit, queue actions | approve/reject/pause/unpause/replay | AdminActionLogged |
| AI & RAG | retrieval orchestration and evidence logs | answer question, export audit trail | AiAnswerGenerated |

## 6. Failure Architecture Decision Matrix

| Operation Type | Reliability Pattern | Notes |
|---|---|---|
| Single DB mutation | DB transaction | Fast path, synchronous response |
| Multi-table same DB mutation | DB transaction + invariant checks | Keep write atomic |
| DB write + external side effect | Transactional Outbox + worker | Avoid dual-write inconsistency |
| Webhook processing | Inbox dedupe + idempotent handler | Replay-safe by provider event ID |
| Long-running multi-step cross-domain flow | Saga orchestrator + compensations | Explicit state transitions |
| Human approval/time window flow | Process manager with timeout and retry | Escalation and manual replay |

## 7. Where Saga Should Be Used First

Saga is not required everywhere. Use it where all are true:
- Multi-step operation
- Crosses module boundaries
- Includes external systems
- Needs compensation

Priority Saga workflows:

1. **Booking to Payout Saga (highest priority)**
- request booking
- create payment intent
- payment succeeded
- session completed
- escrow timer elapsed (30 days)
- payout transfer

Compensations:
- booking cancelled before completion -> refund/cancel payout
- payment failure -> booking rollback to cancelled
- payout transfer failure -> retry with backoff, then manual queue

2. **Advisor Onboarding/Verification Saga**
- profile submitted
- documents uploaded
- admin verification
- Stripe onboarding complete
- advisor approved and published

Compensations:
- failed verification -> rejection state + reason
- Stripe capability revoked -> auto-pause advisor

3. **PDF Generation Workflow (Saga-lite)**
- gather inputs
- fill template
- render draft
- persist artifact + audit

Compensations:
- rendering failure -> retry with fallback renderer
- persist failure -> mark draft failed and keep trace record

## 8. Durable Workflow Components to Add

Add these DB-backed primitives:

1. `outbox_events`
- event_id (unique), aggregate_type, aggregate_id, event_type, payload, status, retry_count, next_attempt_at, created_at

2. `inbox_events`
- source, source_event_id (unique), received_at, processed_at, status, last_error

3. `workflow_runs`
- workflow_id, workflow_type, correlation_id, state, started_at, updated_at, finished_at

4. `workflow_steps`
- workflow_id, step_name, step_status, attempt, started_at, ended_at, error

5. `dead_letter_events`
- original_event_id, workflow_id, reason, payload, moved_at, replayed_at

## 9. Operational Guardrails

1. **Correlation ID on every request and event**
2. **Structured logs with domain, actor, estateId/bookingId**
3. **SLOs**
- API availability and p95 latency
- webhook processing lag
- payout release success rate
- PDF generation success rate
4. **Replay tooling in admin**
- replay failed workflow step
- replay dead-letter event

## 10. Rollout Plan (No Big-Bang Rewrite)

Phase 1 (2-3 weeks)
- Contract hardening for critical flows (booking/payment/pdf).
- Enforce module ownership and route thinness.
- Add correlation IDs and consistent error envelope.

Phase 2 (3-5 weeks)
- Implement Outbox + Inbox tables and workers.
- Migrate Stripe webhook handlers to durable processing.
- Migrate payout scheduler outputs to workflow events.

Phase 3 (4-6 weeks)
- Implement Booking-to-Payout Saga orchestrator.
- Add dead-letter queue and admin replay UI.
- Add advisor onboarding saga and PDF saga-lite.

## 11. What We Should Not Do Right Now

- Do not split into microservices yet.
- Do not introduce message broker complexity before outbox/inbox is stable.
- Do not keep business orchestration inside route handlers for new features.

## 12. Decision

For this application, the right architecture style is:

**Modular Monolith + Domain State Machines + Durable Async (Outbox/Inbox) + Selective Saga Orchestration for high-risk workflows.**

This gives us legal/financial reliability now while preserving velocity.
