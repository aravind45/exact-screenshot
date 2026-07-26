
# Advisor Marketplace - Comprehensive Test Plan

**Version:** 1.0
**Date:** 2026-02-18
**Coverage:** Unit - Integration - E2E - Security

---

## 1. Unit Tests (Service Layer)

Unit tests run in **Vitest** with a mocked Prisma client (`vi.mock("../lib/prisma")`).
No real database connections. All time-sensitive tests use `vi.setSystemTime()`.

---

### 1.1 `AvailabilityService.getSlotsForDate`

#### TC-AV-01 - No availability rules = slot list

**Setup:**
- Advisor has no `AvailabilityRule` rows for the requested `dayOfWeek`.
- No `AvailabilityException` rows for the date.

**Input:** `advisorId`, `date = 2026-03-10` (Monday), `durationMinutes = 60`

**Expected:** Returns `[]`

**Acceptance Criteria:**
- Function returns empty array without throwing.
- No database write operations performed.

#### TC-AV-02 - Blackout exception = slot list

**Setup:**
- Advisor has a Monday rule: 09:00-17:00.
- AvailabilityException for 2026-03-10 with isBlackout = true.

**Expected:** Returns []

**Acceptance Criteria:**
- Exception check occurs before slot generation.
- No slots returned even though a weekly rule exists.

---

#### TC-AV-03 - Rule exists, no conflicts = slots returned

**Setup:**
- Advisor has a Monday rule: 09:00-12:00, timezone America/New_York.
- bufferMinutes = 0, durationMinutes = 60. No existing bookings. No exceptions.

**Expected:** Returns [09:00, 10:00, 11:00] (3 slots)

**Acceptance Criteria:**
- Exactly 3 slots returned as ISO UTC datetime strings.
- Slots do not overlap.

---

#### TC-AV-04 - Rule + existing booking = slot removed

**Setup:**
- Same rule as TC-AV-03. Existing CONFIRMED booking 10:00-11:00 UTC. bufferMinutes = 0.

**Expected:** Returns [09:00, 11:00] (10:00 removed)

**Acceptance Criteria:**
- Exactly 2 slots returned.
- Bookings with status CANCELLED or REFUNDED do NOT block slots.

---

#### TC-AV-05 - Buffer minutes respected

**Setup:**
- Monday rule: 09:00-12:00. bufferMinutes = 15, durationMinutes = 60.
- Existing CONFIRMED booking 09:00-10:00 UTC.

**Expected:** 10:00 slot blocked (within 15-min buffer after session). Next valid slot: 10:15 (ends 11:15, within rule end 12:00).

**Acceptance Criteria:**
- Buffer window (session end + bufferMinutes) excluded from next slot start.
- No slot returned whose end time exceeds rule end time.

---

#### TC-AV-06 - maxSessionsPerDay cap enforced

**Setup:**
- Monday rule: 09:00-17:00. maxSessionsPerDay = 2, durationMinutes = 60.
- 2 existing CONFIRMED bookings: 09:00-10:00 and 10:00-11:00.

**Expected:** Returns [] - advisor hit daily session cap.

**Acceptance Criteria:**
- Function counts REQUESTED + CONFIRMED bookings for the day.
- If count , returns empty array.

### 1.2 AdvisorMarketplaceService.searchAdvisors

#### TC-SEARCH-01 - Specialty filter
**Expected:** GIN containment used. PROBATE-only advisors returned.

#### TC-SEARCH-02 - State filter
**Expected:** statesServed check used. TX-only excluded.

#### TC-SEARCH-03 - Price range
**Expected:** hourlyRate <= maxPriceCents/100.

#### TC-SEARCH-04 - Type filter
**Expected:** Exact string match on advisorType.

#### TC-SEARCH-05 - Pagination
**Expected:** Correct offset, total in response meta.

#### TC-SEARCH-06 - Only APPROVED returned
**Acceptance Criteria:** DRAFT/PENDING_REVIEW/PAUSED/REJECTED never appear.

---

### 1.3 BookingService

#### TC-BOOK-01 - Concurrency: only one slot booking succeeds

**Setup:** Two concurrent createBooking() calls for same advisor+slot.
**Mechanism:** pg_advisory_xact_lock per advisor+slot. First commits. Second finds conflict.
**Expected:** Exactly 1 booking created. Second call returns HTTP 409.
**Acceptance Criteria:** DB has 1 booking. Error: Slot no longer available.

#### TC-BOOK-02 - Idempotency key prevents duplicates

**Action:** Call createBooking() twice with same idempotencyKey.
**Expected:** Returns original booking. No new row. Payment NOT re-created.
**Acceptance Criteria:** P2002 Prisma error caught, existing booking returned.

#### TC-BOOK-03 - Cancellation within window - no refund

**Setup:** Booking CONFIRMED, startTime=now()+12h, cancellationHours=24.
**Expected:** status=CANCELLED, refundAmount=null, cancelledBy set.

#### TC-BOOK-04 - Cancellation outside window - full refund

**Setup:** Booking CONFIRMED, startTime=now()+48h, cancellationHours=24.
**Expected:** status=CANCELLED, full refund via Stripe, refundedAt set.

## 2. Integration Tests (API Routes)

Integration tests use **Supertest** with real test database seeded via Prisma.

### 2.1 POST /api/bookings

#### TC-INT-BOOK-01 - Valid booking created (HTTP 201)
**Auth:** Executor JWT.
**Body:** advisorId, ratePlanId, startTime, timezone, intakeAnswers, idempotencyKey
**Expected:** HTTP 201, status=REQUESTED.
**Acceptance Criteria:** platformFee=20%, advisorPayout=80%, stripePaymentIntentId=null.

#### TC-INT-BOOK-02 - Slot already taken (HTTP 409)
**Expected:** HTTP 409, error: Slot no longer available. No new booking row.

#### TC-INT-BOOK-03 - Advisor cannot book (HTTP 403)
**Auth:** Advisor JWT. **Expected:** HTTP 403, error: Advisors cannot book sessions.

#### TC-INT-BOOK-04 - Missing field (HTTP 400)
**Body:** Missing startTime. **Expected:** HTTP 400 with Zod validation error.

### 2.2 POST /api/advisor/submit-review

#### TC-INT-SUB-01 - DRAFT to PENDING_REVIEW (HTTP 200)
**Auth:** Advisor (DRAFT). **Expected:** status=PENDING_REVIEW in DB.
**Acceptance Criteria:** AdminActionLog entry action=ADVISOR_SUBMITTED. Admin notified.

#### TC-INT-SUB-02 - Already APPROVED (HTTP 409)
**Expected:** error: Profile is already approved.

#### TC-INT-SUB-03 - Already PENDING_REVIEW (HTTP 409)
**Expected:** error: Profile is already under review.

### 2.3 POST /api/admin/marketplace/advisors/:id/approve

#### TC-INT-APPROVE-01 - Sets APPROVED + logs audit
**Auth:** Admin JWT. **Body:** { reason: "All documents verified" }
**Expected:** HTTP 200, status=APPROVED.
**Acceptance Criteria:** admin_action_logs: action=APPROVE_ADVISOR, reason set, timestamp within 5s.

#### TC-INT-APPROVE-02 - Non-existent advisor (HTTP 404)
**Expected:** error: Advisor not found.

#### TC-INT-APPROVE-03 - Non-admin (HTTP 403)
**Auth:** Executor JWT. **Expected:** HTTP 403, error: Admin access required.

### 2.4 GET /api/marketplace

| Test ID | Query | Expectation |
|---------|-------|-------------|
| TC-INT-MKT-01 | ?specialty=PROBATE | Only APPROVED advisors with PROBATE |
| TC-INT-MKT-02 | ?state=CA | Only APPROVED advisors serving CA |
| TC-INT-MKT-03 | ?maxPriceCents=15000 | Only advisors with hourlyRate <= $150 |
| TC-INT-MKT-04 | ?advisorType=CPA | Only CPA-type advisors |
| TC-INT-MKT-05 | ?page=2&limit=5 | Second page, meta.total/page/totalPages returned |


## 3. End-to-End Tests (Playwright)

E2E tests run against the full stack: Vite dev + Express API + test Postgres.
All Stripe calls use sk_test_... pointing to Stripe test mode.

### 3.1 Advisor Onboarding Flow

**Test ID:** e2e-advisor-onboard-001

**Steps:**
1. Navigate to /register
2. Fill: email=advisor-test@example.com, password=Test1234!, role=ADVISOR
3. Click Create Account -> redirected to /advisor/onboarding
4. Step 1 - Profile: bio, type=ATTORNEY, specialties=PROBATE+TRUST_ADMIN, states=CA+TX, click Next
5. Step 2 - Rates: Add service: name=Initial Consultation, duration=60, price=200. Next.
6. Step 3 - Availability: Monday 09:00-17:00, Friday 10:00-14:00, timezone=America/Los_Angeles, buffer=15min. Next.
7. Step 4 - Documents: Upload test-bar-card.pdf, fill license#=CA-12345, state=CA, expiry=2028-01-01. Upload. Next.
8. Step 5 - Submit: Click Submit for Review. Assert success: Your profile has been submitted for review.

**Acceptance Criteria:**
- Advisor profile status=PENDING_REVIEW in DB.
- AdvisorLicenseDocument row created with status=UPLOADED.
- AvailabilityRule rows for Monday and Friday.
- AdvisorRatePlan row for Initial Consultation.
- AdminActionLog with action=ADVISOR_SUBMITTED.
- Advisor NOT visible in /api/marketplace.

### 3.2 Executor Booking Flow

**Test ID:** e2e-executor-book-001

**Preconditions:** Approved advisor with slot available 2026-03-10 10:00 AM ET. Executor account exists.

**Steps:**
1. Navigate to /marketplace. Assert advisor cards visible.
2. Filter by specialty=PROBATE. Assert only PROBATE advisors shown.
3. Click advisor -> /marketplace/:advisorId. Assert bio, specialties, rate plans shown.
4. Select Initial Consultation (60 min - $200).
5. Click date 2026-03-10 on calendar. Click 10:00 AM slot.
6. Fill intake: estateState=CA, situation, urgency. Click Continue to Payment.
7. Enter Stripe test card 4242... exp 12/28 CVC 123. Click Pay $200.
8. Assert confirmation page with booking ID, date, advisor name, meeting link placeholder.

**Acceptance Criteria:**
- Booking status=CONFIRMED (requiresApproval=false) or REQUESTED.
- MarketplacePayment status=SUCCEEDED.
- intakeAnswers stored in booking.
- Executor sees booking in /api/bookings/my-bookings.
- Advisor sees booking in /api/bookings/advisor-bookings.

### 3.3 Admin Review Flow

**Test ID:** e2e-admin-review-001

**Preconditions:** Admin account (role=ADMIN). Advisor in PENDING_REVIEW state.

**Steps:**
1. Login as admin. Navigate to /admin/advisors.
2. Assert pending advisor in queue with PENDING REVIEW badge.
3. Click advisor -> /admin/advisors/:id. Assert full profile, license doc preview link.
4. Click View on license doc -> pre-signed URL opens in new tab.
5. Click Approve. Fill reason=License verified, credentials confirmed. Click Confirm.
6. Assert toast: Advisor approved successfully.
7. Back to /admin/advisors - advisor no longer in pending queue.
8. Navigate to /marketplace - advisor now visible.
9. Navigate to /admin/audit-log - assert APPROVE_ADVISOR entry.

**Acceptance Criteria:**
- Advisor status=APPROVED in DB.
- AdminActionLog: action=APPROVE_ADVISOR, reason=License verified, credentials confirmed.
- Advisor visible in GET /api/marketplace.
- Entry visible in GET /api/admin/audit-log.

## 4. Security Tests

### 4.1 Role Isolation

#### TC-SEC-01 - Executor cannot access /api/advisor/rates (403)
**Auth:** Executor JWT. **Request:** GET /api/advisors/rates
**Expected:** HTTP 403, error: Advisor access required.
**Acceptance Criteria:** Role check fires before any route handler.

#### TC-SEC-02 - Advisor cannot access /api/admin/marketplace (403)
**Auth:** Advisor JWT. **Request:** GET /api/admin/advisors/queue
**Expected:** HTTP 403, error: Admin access required.

#### TC-SEC-03 - Rate plan belonging to different advisor - 404
**Setup:** Advisor A creates rate plan rp-A. Request authenticated as Advisor B: PUT /api/advisors/rates/rp-A
**Expected:** HTTP 404 (not 403, to avoid confirming resource existence).
**Acceptance Criteria:** Query filters by id=rp-A AND advisorId=<B-profile-id>.

#### TC-SEC-04 - License doc upload URL is pre-signed and expires

**Test Description:**
1. Advisor calls GET /api/advisors/documents/upload-url?fileName=bar-card.pdf&mimeType=application/pdf
2. Server generates pre-signed URL with 15-minute expiry.
3. Assert response contains uploadUrl (HTTPS) and storageKey.
4. Upload succeeds within 15 min using URL directly (no auth header on storage PUT).
5. Same URL after 15 min -> HTTP 403 from storage provider.
6. uploadUrl is NEVER stored in DB; only storageKey stored in advisor_license_documents.
7. Non-owner calls GET /api/advisors/documents/:id/view-url -> HTTP 403.

**Acceptance Criteria:**
- Pre-signed URL generation server-side only.
- Expiry enforced by storage provider (15 min).
- Only owning advisor or ADMIN can request view URL.
- storageKey format does not expose bucket name.

#### TC-SEC-05 - Booking requires payment before CONFIRMED status

**Test Description:**
1. Executor creates booking -> status=REQUESTED.
2. Assert NOT auto-confirmed without payment.
3. POST /api/bookings/:id/payment -> receives clientSecret.
4. Without completing payment, call POST /api/bookings/:id/confirm -> HTTP 402 or 400.
5. Stripe webhook fires payment_intent.succeeded with correct bookingId in metadata.
6. Assert status changes to CONFIRMED only after webhook verified.
7. Tampered Stripe-Signature header -> HTTP 400.

**Acceptance Criteria:**
- CONFIRMED state impossible without verified payment_intent.succeeded.
- stripe.webhooks.constructEvent() mandatory for all Stripe webhooks.
- Idempotency: duplicate webhook events do not double-confirm.

#### TC-SEC-06 - Intake answers accessible only to booking advisor
**Setup:** Booking with intakeAnswers between Executor A and Advisor A. Advisor B authenticated.
**Request:** GET /api/bookings/:id (as Advisor B)
**Expected:** HTTP 403 or 404.
**Acceptance Criteria:** Route checks booking.advisorId === req.advisor.id OR booking.userId === req.user.id.

#### TC-SEC-07 - Advisor notes never returned to executor
**Setup:** Booking has advisorNotes="Private clinical note". Executor calls GET /api/bookings/:id.
**Expected:** Response does NOT contain advisorNotes field.
**Acceptance Criteria:** Serializer strips advisorNotes from executor-facing responses.

---

## 5. Test Environment Setup

```bash
npm install --save-dev vitest @vitest/coverage-v8 supertest @playwright/test
npx vitest run --coverage
npx vitest run --config vitest.integration.config.ts
npx playwright test --project=chromium
```

## 6. Coverage Requirements

| Layer | Minimum Coverage |
|-------|------------------|
| Service layer (unit) | 85% line coverage |
| API routes (integration) | 80% route coverage |
| Critical paths (booking, payment) | 100% coverage |
| Security middleware | 100% coverage |

---

*Test Plan maintained alongside ADVISOR_MARKETPLACE_PRD.md.*
