
# Advisor Marketplace - Security Checklist

**Version:** 1.0
**Date:** 2026-02-18
**Owner:** Platform Engineering + Security Review

> This document defines the security requirements, controls, and verification steps
> for the Estate Settlement Advisor Marketplace feature.

---

## 1. Authentication & Authorization

### 1.1 Route-Level JWT Authentication

- [ ] **All marketplace routes require valid JWT authentication**
  - Routes under `/api/advisors/*`, `/api/bookings/*`, `/api/admin/*`, `/api/marketplace` must reject requests without a valid `Authorization: Bearer <token>` header.
  - Verification: `authMiddleware` applied to all router instances. Test: unauthenticated GET /api/advisors/me returns HTTP 401.
  - Token blacklist checked on every request (TokenBlacklist table lookup).

### 1.2 Role-Based Access Control (RBAC)

- [ ] **ADVISOR routes check `role === ADVISOR`**
  - Routes: `/api/advisors/profile`, `/api/advisors/rates`, `/api/advisors/availability`, `/api/advisors/documents`, `/api/advisors/submit-review`
  - Middleware: `requireRole(UserRole.ADVISOR)` applied before handler.
  - Executor or Admin calling these routes: HTTP 403.

- [ ] **Admin routes check `isAdmin` flag or `role === ADMIN`**
  - Routes: `/api/admin/advisors/*`, `/api/admin/disputes/*`, `/api/admin/audit-log`
  - Middleware: `requireAdmin()` applied.
  - Non-admin calling these routes: HTTP 403.

- [ ] **Executor routes check `role === EXECUTOR`**
  - Routes: POST `/api/bookings`, GET `/api/bookings/my-bookings`
  - Advisors cannot create bookings for themselves.

### 1.3 Resource Ownership Verification

- [ ] **Rate plan ownership verified before any mutation**
  - PUT/DELETE `/api/advisors/rates/:id` — query filters `{ id, advisorId: req.advisor.id }`.
  - If not found: HTTP 404 (not 403, to avoid resource enumeration).

- [ ] **Document ownership verified before any mutation or URL generation**
  - GET `/api/advisors/documents/:id/view-url` — checks `doc.advisorId === req.advisor.id` OR requester is ADMIN.
  - Non-owner: HTTP 403.

- [ ] **Booking access: only booking owner or advisor can view**
  - GET `/api/bookings/:id` — checks `booking.userId === req.user.id` OR `booking.advisorId === req.advisor.id` OR requester is ADMIN.
  - Unauthorized access: HTTP 403.

- [ ] **Availability rule ownership**
  - DELETE `/api/advisors/availability/rules/:id` — filters by `{ id, advisorId }`.
  - HTTP 404 if not found or not owned.

## 2. Document Storage Security

- [ ] **License documents stored with storage keys only — never public URLs in DB**
  - `advisor_license_documents.storage_key` stores the GCS/S3 object key (e.g., `advisors/<id>/documents/<uuid>.pdf`).
  - `fileUrl` field is NOT stored in this table.
  - Verification: DB schema inspection — no `file_url` column on `advisor_license_documents`.

- [ ] **Pre-signed URLs generated server-side with 15-minute expiry**
  - Server calls `storage.file(storageKey).getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 })`.
  - URL returned to client; never stored in DB.
  - Verification: Test that URL expires after 15 minutes (storage-side enforcement).

- [ ] **Only advisor who owns doc + admins can request signed URL**
  - GET `/api/advisors/documents/:id/view-url` checks ownership.
  - Third-party requests return HTTP 403.

- [ ] **File type validation: only PDF, JPG, PNG accepted**
  - Server-side: Validate `mimeType` against allowlist `[application/pdf, image/jpeg, image/png]`.
  - Client-provided filename is NOT trusted for type determination.
  - File signature (magic bytes) checked for uploaded files.
  - Rejected types: HTTP 415 Unsupported Media Type.

- [ ] **File size limit: 10MB per document**
  - Server enforces `Content-Length <= 10 * 1024 * 1024` before generating upload URL.
  - Verification: Attempt to upload 11MB file -> HTTP 413 Request Entity Too Large.

---

## 3. Payment Security

- [ ] **All Stripe Payment Intents created server-side**
  - Client NEVER calls Stripe API directly for payment intent creation.
  - POST `/api/bookings/:id/payment` creates the PaymentIntent on the server.
  - `clientSecret` returned to client for Stripe.js UI only.

- [ ] **Webhook signature verified for all Stripe events**
  - Endpoint: POST `/api/webhooks/stripe`
  - Uses `stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET)`.
  - Invalid/missing signature: HTTP 400, event ignored.
  - Verification: Test with tampered webhook payload.

- [ ] **Idempotency keys prevent duplicate charges**
  - Each PaymentIntent created with `idempotencyKey = booking.idempotencyKey`.
  - Stripe enforces idempotency for 24 hours.
  - DB-level: `bookings.idempotency_key` has UNIQUE constraint.

- [ ] **Refunds only processed by admin or system**
  - POST `/api/admin/disputes/:id/resolve` with refundAmount triggers refund.
  - Cancellation-policy refunds triggered automatically by booking service.
  - Executors cannot directly trigger refunds; must go through dispute flow.
  - Verification: Executor calling a hypothetical refund endpoint -> HTTP 403.

---

## 4. PII & Data Privacy

- [ ] **Advisor SSN/EIN never stored**
  - Platform does not collect SSN/EIN; tax reporting handled by Stripe Connect (1099-K).
  - Schema inspection: No ssn/ein column in advisor_profiles.

- [ ] **License numbers encrypted at rest**
  - `advisor_license_documents.license_number` stored encrypted.
  - Requires DB-level encryption (column-level encryption or full-disk encryption).
  - Note: Current schema stores plaintext — track as remediation item.
  - Encryption key managed via KMS (GCP KMS or AWS KMS).

- [ ] **Executor intake answers are sensitive — access restricted**
  - `bookings.intake_answers` (JSON) contains executor estate details.
  - Only accessible by: booking advisor, booking executor (owner), admin.
  - GET /api/bookings/:id returns intakeAnswers only to authorized parties.
  - Third-party access: HTTP 403.

- [ ] **Advisor notes are private — never returned to executor**
  - `bookings.advisor_notes` is POST-call advisor-only content.
  - API response serializer OMITS `advisorNotes` when responder is the executor.
  - Verification: TC-SEC-07 test case.

---

## 5. Audit Trail

- [ ] **All admin actions logged in AdminActionLog**
  - Required fields: `adminId`, `action`, `targetType`, `targetId`, `reason`, `createdAt`.
  - Actions logged: APPROVE_ADVISOR, REJECT_ADVISOR, PAUSE_ADVISOR, UNPAUSE_ADVISOR,
    VERIFY_DOCUMENT, REJECT_DOCUMENT, RESOLVE_DISPUTE, ISSUE_REFUND.
  - Verification: Each admin route creates AdminActionLog row in same transaction.

- [ ] **Booking state transitions logged**
  - Transitions logged to SettlementActivity or dedicated BookingAuditLog.
  - Fields: bookingId, fromStatus, toStatus, userId, timestamp, reason.

- [ ] **Rate plan changes logged**
  - CREATE, UPDATE, DELETE operations on AdvisorRatePlan logged with old/new values in metadata.

- [ ] **Document upload and verification logged**
  - UPLOADED: logged when advisor uploads doc.
  - VERIFIED/REJECTED: logged when admin reviews with adminId and reason.
  - Both actions create AdminActionLog rows.

## 6. Race Condition Prevention

- [ ] **pg advisory locks for slot reservation**
  - Pattern: `SELECT pg_advisory_xact_lock(hashtext(advisor_id || start_time::text))`
  - Applied at the start of `createBooking` transaction.
  - Ensures only one booking can be created per advisor+slot at a time.
  - Lock auto-released on transaction commit/rollback.
  - Verification: TC-BOOK-01 concurrency test.

- [ ] **Booking version field for optimistic locking**
  - `bookings.version` integer field incremented on each update.
  - Update queries include `WHERE version = <expected>` predicate.
  - Stale update (version mismatch): HTTP 409 Conflict.
  - Verification: Simulate two concurrent status updates to same booking.

- [ ] **Idempotency key unique constraint**
  - `bookings.idempotency_key` has `@unique` constraint in Prisma schema.
  - Prevents duplicate booking rows from retry storms.
  - Service layer catches Prisma P2002 error and returns existing booking.

---

## 7. Input Validation

- [ ] **All request bodies validated with Zod schemas**
  - Each route defines a Zod schema for its request body.
  - Invalid body: HTTP 400 with structured error listing field names and reasons.
  - Zod validation runs before any business logic or DB queries.

- [ ] **Date/time inputs validated as valid ISO strings**
  - `startTime`, `endTime`, `expirationDate` validated as `z.string().datetime()`.
  - Non-ISO strings: HTTP 400.
  - Past dates for bookings: HTTP 422 with error: Cannot book in the past.

- [ ] **Price values validated as positive integers (cents)**
  - `priceCents` validated as `z.number().int().positive()`.
  - Negative values, floats, strings: HTTP 400.

- [ ] **Rating validated as 1-5 integer**
  - Review rating validated as `z.number().int().min(1).max(5)`.
  - Out-of-range: HTTP 400.

- [ ] **File names sanitized before storage**
  - Uploaded file names stripped of path traversal characters (`../`, `/`, `\`).
  - Sanitized using `path.basename()` and replacing special characters.
  - Sanitized name stored in `advisor_license_documents.file_name`.

---

## 8. Rate Limiting

Implemented via `express-rate-limit` middleware, keyed by authenticated user ID.

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/bookings | 10 requests | 1 hour per user |
| POST /api/bookings/:id/payment | 10 requests | 1 hour per user |
| PUT /api/advisors/profile | 20 requests | 1 hour per advisor |
| POST /api/auth/login | 20 attempts | 15 minutes per IP |
| POST /api/auth/register | 5 requests | 1 hour per IP |
| GET /api/advisors/documents/upload-url | 20 requests | 1 hour per advisor |

**Implementation:**
```typescript
const bookingRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: "Too many booking requests, please try again later" },
});
```

**Verification:**
- Send 11 booking creation requests in 1 hour -> 11th returns HTTP 429.
- Rate limit headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`.

---

## 9. Security Headers

- [ ] **Helmet.js configured** — `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`.
- [ ] **CORS restricted** — only allowed origins in production.
- [ ] **No sensitive data in error responses** — stack traces never exposed in production.
- [ ] **API responses use `Content-Type: application/json`** — no HTML injection via JSON endpoints.

---

## 10. Environment & Secrets

- [ ] `STRIPE_SECRET_KEY` never exposed to client bundle.
- [ ] `STRIPE_WEBHOOK_SECRET` stored in environment variable, not hardcoded.
- [ ] `DATABASE_URL` contains credentials — stored in GCP Secret Manager / Vercel environment variables.
- [ ] `JWT_SECRET` minimum 32-character random string, rotated quarterly.
- [ ] `GCS_BUCKET` and service account key stored as secrets, not in source code.
- [ ] `.env` file in `.gitignore`; `.env.example` committed without values.

---

*Security checklist reviewed alongside ADVISOR_MARKETPLACE_PRD.md.*
*Last reviewed: 2026-02-18*
