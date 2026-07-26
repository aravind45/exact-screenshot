# Communication System Execution Plan (Executor-Centric)

## Sprint 1 (Weeks 1–2): Data Integrity + API Contract Alignment

### Epics
1. Communication normalization hardening
2. Update/create API contract fixes
3. Attachment access security

### Key Tickets
- BE-001: Add normalization utility (`normalizeDirection`, `normalizeType`, `normalizeChannel`) and apply across create/update/inbox/outbox/search.
- BE-002: Enforce canonical enums in Zod schemas and DB writes.
- BE-003: Make `occurredAt` required in create API (or default server-side).
- BE-004: Expand `PATCH /communications/:id` schema to support editable fields used by UI.
- BE-005: Fix activity note direction logic using normalized values only.
- BE-006: Add ownership check for `GET /communications/attachments/:id`.
- FE-001: Align Inbox/FollowUps update payload fields with backend contract.
- QA-001: Contract + regression tests for create/update/inbox/outbox/follow-ups.

### API Contract (end of sprint)
- `POST /communications` accepts canonical values only; `occurredAt` guaranteed.
- `PATCH /communications/:id` supports:
  - `type,direction,occurredAt,subject,notes,contactName,contactChannel,followUpDueAt,followUpCompletedAt,statusChange`

---

## Sprint 2 (Weeks 3–4): Delivery Trust + Simulation Transparency

### Epics
1. Delivery lifecycle tracking
2. Simulated vs. real send visibility

### Key Tickets
- DB-101: Add fields to `communication`: `deliveryStatus`, `deliveryProvider`, `externalMessageId`, `isSimulated`, `deliveryUpdatedAt`.
- INT-001: Store Mailgun response/message ID on send.
- INT-002: Ingest Mailgun event webhooks to update delivery status.
- INT-003: Fax status mapping (`submitted/sent/failed/simulated`).
- FE-010: Show delivery badges in Timeline/Inbox.
- FE-011: Add explicit simulated badge + warning banner.

### API Contract (end of sprint)
- `GET /communications/*` includes delivery fields.
- New webhook handler updates `deliveryStatus` by `externalMessageId`.

---

## Sprint 3 (Weeks 5–6): Inbound Triage Safety

### Epics
1. AI triage confidence routing
2. Unassigned communication queue

### Key Tickets
- DB-201: Add `triageConfidence`, `triageReason`, `triagedBy`, `triagedAt`, plus unassigned support.
- BE-020: Replace fallback-to-first-asset behavior with confidence thresholds.
- BE-021: Add `GET /communications/unassigned` and `POST /communications/:id/assign`.
- FE-020: Build “Unassigned” queue UI with quick assignment action.
- AUD-001: Log reassignment events in settlement activity.

### API Contract (end of sprint)
- Inbound items may remain unassigned.
- Assignment endpoint records actor and timestamp.

---

## Sprint 4 (Weeks 7–8): Follow-Up Operations Engine

### Epics
1. Ownership + SLA + escalation
2. Queue-driven executor workflow

### Key Tickets
- DB-301: Add `ownerUserId`, `priority`, `slaDueAt`, `escalationLevel`, `threadId`.
- BE-030: APIs for assign/reassign/snooze/escalate/bulk-complete.
- BE-031: SLA rules engine by institution type + channel.
- FE-030: FollowUps redesign into queues (My Queue, Team Queue, Overdue, Waiting, Unassigned).
- FE-031: One-click actions (Resolve, Escalate, Assign, Reschedule).

### API Contract (end of sprint)
- `PATCH /communications/:id/assignment`
- `PATCH /communications/:id/escalate`
- `POST /communications/bulk-complete`

---

## Sprint 5 (Weeks 9–10): Threading + Collaboration Foundations

### Epics
1. Conversation threads
2. Role-aware visibility model

### Key Tickets
- DB-401: Create `communication_thread` and link messages by `threadId`.
- DB-402: Add visibility metadata (`visibilityScope`, `allowedRoles`).
- BE-040: Thread APIs (`GET /communications/threads`, `GET /threads/:id/messages`).
- BE-041: Role middleware for executor/heir/advisor access.
- FE-040: Threaded message UI for key views.

---

## Sprint 6 (Weeks 11–12): Collaboration Workflows (Executor/Heir/Advisor)

### Epics
1. Shared communication workspace
2. Controlled approvals and mentions

### Key Tickets
- BE-050: Add comments + mentions (`@user`) per communication/thread.
- BE-051: Add “request approval” workflow for sensitive outbound sends.
- FE-050: Role-based communication panels (executor full; heir/advisor scoped).
- FE-051: Approval inbox and decision actions.
- AUD-050: Immutable audit entries for approvals and edits.

---

## Sprint 7 (Weeks 13–14): Compliance + Institution Playbooks

### Epics
1. Defensibility exports
2. Institution playbooks + pre-send validation

### Key Tickets
- BE-060: Compliance export bundle (timeline + attachments + status transitions + actors).
- BE-061: Add retention/legal-hold tagging.
- LOG-060: Institution playbook rules (required docs, SLA windows, preferred channels).
- BE-062: Pre-send gate for missing required docs (with override reason).
- FE-060: “Case Defensibility Report” UI + playbook guidance cards.

---

## Database Migration Order (Safe Sequence)
1. M1: Enum normalization prep (non-breaking checks/columns)
2. M2: Delivery metadata columns
3. M3: Triage metadata + unassigned support
4. M4: Follow-up ownership/SLA/escalation fields
5. M5: Thread tables + FKs
6. M6: Collaboration/approval/comment tables
7. M7: Compliance/export/legal-hold tables

> Run backfill scripts between migrations; add indexes for:
> `estateId, direction, type, followUpDueAt, ownerUserId, threadId, deliveryStatus`.

---

## Delivery Guardrails
- Feature flags by phase (`comm_delivery_status`, `comm_unassigned_queue`, `comm_sla_engine`, etc.)
- Backward-compatible APIs for at least one sprint before endpoint/field removals
- QA matrix for executor/heir/advisor permissions + webhook replay tests
- Observability dashboard for send success, misassignment rate, overdue age, escalation frequency
