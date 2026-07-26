# Estate Settlement Advisor Marketplace — PRD & Technical Specification

**Version:** 1.0  
**Date:** 2026-02-18  
**Product Area:** ExpectedEstate → Advisor Marketplace  
**Stack:** Node/TypeScript · Prisma · PostgreSQL (Neon) · React · Stripe Connect

---

## 1. Executive Summary

The **Estate Settlement Advisor Marketplace** is a two-sided scheduling + compliance platform embedded inside ExpectedEstate. It connects grieving executors with vetted attorneys, CPAs, probate paralegals, and estate settlement coaches via real-time calendar booking, upfront payment, and admin-supervised license verification.

**This is NOT a legal-advice-automation platform.** All advisors operate as independent contractors. Platform displays prominent disclaimers. Platform earns a 20% fee on each booking.

---

## 2. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Reduce executor "who do I call?" friction | Booking within 10 mins of estate creation |
| Supply-side quality | ≥ 95% advisors with verified license before listing |
| Trust | ≤ 0.5% dispute rate |
| Revenue | 20% platform fee on every paid session |

---

## 3. Roles & Permissions (RBAC)

### 3.1 Role Definitions

| Role | Description |
|------|-------------|
| `ADVISOR` | Licensed professional — can publish availability and accept bookings |
| `EXECUTOR` | Estate executor — can browse, book, and manage consultations |
| `ADMIN` | Platform operator — approves advisors, handles disputes, moderation |

### 3.2 Permission Matrix

| Permission | EXECUTOR | ADVISOR | ADMIN |
|---|---|---|---|
| Browse advisor directory | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ |
| Edit own advisor profile | ❌ | ✅ | ✅ |
| Change own rates | ❌ | ✅ | ✅ |
| Edit own availability | ❌ | ✅ | ✅ |
| Upload license documents | ❌ | ✅ | ❌ |
| View own license docs | ❌ | ✅ | ✅ |
| Submit profile for review | ❌ | ✅ | ❌ |
| Create booking | ✅ | ❌ | ❌ |
| Confirm/decline booking | ❌ | ✅ | ❌ |
| Cancel own booking | ✅ | ✅ | ✅ |
| View own bookings | ✅ | ✅ | ✅ |
| Upload supporting docs (executor) | ✅ | ❌ | ❌ |
| View client intake responses | ❌ | ✅ | ✅ |
| Write post-call notes | ❌ | ✅ | ❌ |
| Leave review | ✅ | ❌ | ❌ |
| Approve/reject advisors | ❌ | ❌ | ✅ |
| Pause/unpause advisor | ❌ | ❌ | ✅ |
| View audit log | ❌ | ❌ | ✅ |
| Handle disputes/refunds | ❌ | ❌ | ✅ |
| View payout history | ❌ | ✅ | ✅ |
| Trigger payout | ❌ | ❌ | ✅ |

---

## 4. Core User Stories

### 4.1 Advisor Stories

| Story | Acceptance Criteria |
|-------|---------------------|
| Register as advisor | Can create advisor profile with bio, specialties, states, languages |
| Set rates | Can add base hourly rate + named service packages (duration, price) |
| Upload license docs | Pre-signed S3 URL upload; metadata (license#, state, expiry) captured |
| Submit for review | "Submit for Review" CTA triggers PENDING_REVIEW status + admin notification |
| Set availability | Weekly schedule, timezone, buffer time, max sessions/day, blackout dates |
| Manage bookings | View upcoming sessions, accept/decline (if require_approval=true), reschedule |
| View intake responses | Post-booking executor questionnaire visible before session |
| Write post-call notes | Private notes per booking, only visible to advisor |
| Onboard Stripe Connect | Stripe Connect Express onboarding flow via `/advisor/payouts` |
| View earnings | Dashboard shows paid, pending, upcoming payouts |

### 4.2 Executor Stories

| Story | Acceptance Criteria |
|-------|---------------------|
| Create account + estate context | State, situation, will/trust toggle captured |
| Browse advisors | Filter by specialty, state, price, rating, availability |
| View advisor profile | Bio, expertise, license status, ratings, calendar |
| Book a slot | Select service, pick time slot, answer intake questions, pay |
| Receive confirmation | Email + in-app confirmation with meeting link placeholder |
| Manage booking | Reschedule/cancel within policy; upload docs to booking |
| Get reminders | Email T-24h and T-1h before session |

### 4.3 Admin Stories

| Story | Acceptance Criteria |
|-------|---------------------|
| Review onboarding queue | See all advisors in PENDING_REVIEW |
| Approve advisor | Sets status to APPROVED; advisor goes live |
| Reject advisor | Sets status to REJECTED with reason; notifies advisor |
| Request more info | Sends message to advisor; pauses queue item |
| Pause advisor | Sets PAUSED; hides from marketplace; existing bookings handled per rule |
| Audit log | All admin actions logged with timestamp, admin ID, reason |
| Dispute management | View disputes, issue full/partial refund, mark resolved |

---

## 5. Data Model (Prisma Schema)

```prisma
enum AdvisorStatus {
  DRAFT
  PENDING_REVIEW
  APPROVED
  REJECTED
  PAUSED
}

enum DocumentStatus {
  UPLOADED
  NEEDS_REVIEW
  VERIFIED
  REJECTED
}

enum BookingStatus {
  REQUESTED
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
  REFUNDED
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum DisputeStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED_REFUNDED
  RESOLVED_RELEASED
  CLOSED
}

model AdvisorProfile {
  id                 String         @id @default(uuid())
  userId             String         @unique
  bio                String?
  specialties        String[]       // ["PROBATE", "ESTATE_TAX", "TRUST_ADMIN"]
  statesServed       String[]       // ["CA", "TX", "FL"]
  languages          String[]       @default(["English"])
  advisorType        String         @default("ATTORNEY") // ATTORNEY, CPA, PARALEGAL, COACH
  status             AdvisorStatus  @default(DRAFT)
  hourlyRate         Decimal        // Kept for backwards compat
  requiresApproval   Boolean        @default(false)
  cancellationHours  Int            @default(24)
  noShowPolicy       String?
  profileImage       String?
  timezone           String         @default("America/New_York")
  maxSessionsPerDay  Int            @default(8)
  bufferMinutes      Int            @default(15)
  meetingLink        String?        // Zoom/Meet link
  publicNotes        String?
  // Legacy fields kept for migration
  stripeAccountId    String?
  stripeOnboardingComplete Boolean  @default(false)
  stripeDetailsSubmitted   Boolean  @default(false)
  verificationStatus String         @default("PENDING")
  licenseNumber      String?
  licenseDocument    String?
  isVerified         Boolean        @default(false)
  avgRating          Float?
  totalReviews       Int            @default(0)
  // Relations
  user               User
  ratePlans          AdvisorRatePlan[]
  licenseDocuments   AdvisorLicenseDocument[]
  availabilityRules  AvailabilityRule[]
  availabilityExceptions AvailabilityException[]
  bookings           Booking[]
  reviews            Review[]
}

model AdvisorLicenseDocument {
  id            String         @id @default(uuid())
  advisorId     String
  documentType  String         // BAR_CARD, CPA_LICENSE, GOVERNMENT_ID, OTHER
  storageKey    String         // S3/GCS key
  fileName      String
  mimeType      String
  status        DocumentStatus @default(UPLOADED)
  licenseNumber String?
  issuingState  String?
  expirationDate DateTime?
  rejectionReason String?
  verifiedAt    DateTime?
  verifiedBy    String?        // Admin user ID
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  advisor       AdvisorProfile
}

model AdvisorRatePlan {
  id              String   @id @default(uuid())
  advisorId       String
  serviceName     String   // "Initial Consultation", "Document Review", "Probate Consult"
  durationMinutes Int      // 15, 30, 45, 60, 90
  priceCents      Int      // Price in cents
  currency        String   @default("USD")
  description     String?
  isActive        Boolean  @default(true)
  sortOrder       Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  advisor         AdvisorProfile
  bookings        Booking[]
}

model AvailabilityRule {
  id              String   @id @default(uuid())
  advisorId       String
  dayOfWeek       Int      // 0=Sunday, 6=Saturday
  startTime       String   // "09:00" in advisor's timezone
  endTime         String   // "17:00"
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  advisor         AdvisorProfile
}

model AvailabilityException {
  id          String   @id @default(uuid())
  advisorId   String
  date        DateTime @db.Date
  isBlackout  Boolean  @default(true)  // true=unavailable, false=custom hours
  startTime   String?  // Only if isBlackout=false
  endTime     String?
  reason      String?
  createdAt   DateTime @default(now())
  advisor     AdvisorProfile
}

model Booking {
  id                String        @id @default(uuid())
  userId            String
  advisorId         String
  ratePlanId        String?
  estateId          String?
  status            BookingStatus @default(REQUESTED)
  // Time
  startTime         DateTime      // UTC
  endTime           DateTime      // UTC
  durationMinutes   Int
  timezone          String        // Executor's timezone at booking time
  // Legacy fields
  sessionDuration   Int?
  sessionDate       DateTime?
  // Money
  totalAmount       Decimal
  platformFee       Decimal
  advisorPayout     Decimal
  currency          String        @default("USD")
  escrowReleaseDate DateTime?
  payoutStatus      String        @default("UNPAID")
  // Intake & Notes
  intakeAnswers     Json?         // {q: answer} pairs
  advisorNotes      String?       // Private post-call notes
  meetingLink       String?
  // Cancellation
  cancellationReason String?
  cancelledBy       String?       // userId
  cancelledAt       DateTime?
  // Refund
  refundAmount      Decimal?
  refundedAt        DateTime?
  // Stripe
  stripePaymentId   String?
  stripePaymentIntentId String?   @unique
  // Meta
  idempotencyKey    String?       @unique
  version           Int           @default(0)  // Optimistic lock
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  // Relations
  user              User
  advisor           AdvisorProfile
  ratePlan          AdvisorRatePlan?
  estate            Estate?
  payment           Payment?
  review            Review?
  dispute           Dispute?
}

model Payment {
  id                    String        @id @default(uuid())
  bookingId             String        @unique
  userId                String
  stripePaymentIntentId String        @unique
  stripeChargeId        String?
  amount                Int           // Cents
  currency              String        @default("USD")
  status                PaymentStatus @default(PENDING)
  capturedAt            DateTime?
  refundedAmount        Int?
  refundedAt            DateTime?
  stripeRefundId        String?
  metadata              Json?
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
  booking               Booking
  user                  User
}

model Dispute {
  id           String        @id @default(uuid())
  bookingId    String        @unique
  openedBy     String        // userId
  reason       String
  description  String?
  status       DisputeStatus @default(OPEN)
  resolution   String?
  resolvedBy   String?       // Admin userId
  resolvedAt   DateTime?
  refundAmount Int?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  booking      Booking
}

model AdminActionLog {
  id          String   @id @default(uuid())
  adminId     String
  action      String   // APPROVE_ADVISOR, REJECT_ADVISOR, PAUSE_ADVISOR, etc.
  targetType  String   // ADVISOR, BOOKING, DOCUMENT, DISPUTE
  targetId    String
  reason      String?
  metadata    Json?
  createdAt   DateTime @default(now())
  admin       User
}
```

---

## 6. API Specification

### 6.1 Advisor Registration & Profile

```
POST   /api/advisors/profile           Create/update profile
GET    /api/advisors/me                Get own profile
POST   /api/advisors/submit-review     Submit profile for admin review
```

### 6.2 License Documents

```
GET    /api/advisors/documents/upload-url   Get pre-signed URL
POST   /api/advisors/documents              Record document metadata after S3 upload
GET    /api/advisors/documents              List own documents
DELETE /api/advisors/documents/:id          Delete a document
```

### 6.3 Rate Plans

```
GET    /api/advisors/rates             List own rate plans
POST   /api/advisors/rates             Create rate plan
PUT    /api/advisors/rates/:id         Update rate plan
DELETE /api/advisors/rates/:id         Delete (soft) rate plan
```

### 6.4 Availability

```
GET    /api/advisors/availability/rules       List recurring rules
POST   /api/advisors/availability/rules       Create rule
DELETE /api/advisors/availability/rules/:id   Delete rule
GET    /api/advisors/availability/exceptions  List exceptions
POST   /api/advisors/availability/exceptions  Create exception
DELETE /api/advisors/availability/exceptions/:id  Delete exception
GET    /api/advisors/:id/slots?date=YYYY-MM-DD&ratePlanId=  Available slots for a date
```

### 6.5 Search & Browse

```
GET    /api/advisors/marketplace       List approved advisors (filters: specialty, state, price, rating)
GET    /api/advisors/:id               Get advisor public profile
GET    /api/advisors/:id/availability  Get availability for date range
```

### 6.6 Bookings

```
POST   /api/bookings                   Create booking (concurrency-safe)
GET    /api/bookings/my-bookings       Executor's bookings
GET    /api/bookings/advisor-bookings  Advisor's bookings
GET    /api/bookings/:id               Single booking
POST   /api/bookings/:id/confirm       Advisor confirms
POST   /api/bookings/:id/cancel        Cancel
POST   /api/bookings/:id/complete      Mark complete
POST   /api/bookings/:id/no-show       Mark no-show
POST   /api/bookings/:id/reschedule    Reschedule
POST   /api/bookings/:id/notes         Save advisor post-call notes
POST   /api/bookings/:id/dispute       Open dispute
```

### 6.7 Payments

```
POST   /api/bookings/:id/payment        Create payment intent
POST   /api/bookings/:id/payment/confirm Confirm payment capture
```

### 6.8 Admin

```
GET    /api/admin/advisors/queue        Pending review queue
GET    /api/admin/advisors/:id          Full advisor detail
POST   /api/admin/advisors/:id/approve  Approve
POST   /api/admin/advisors/:id/reject   Reject
POST   /api/admin/advisors/:id/pause    Pause
POST   /api/admin/advisors/:id/unpause  Unpause
GET    /api/admin/disputes              List disputes
POST   /api/admin/disputes/:id/resolve  Resolve dispute
GET    /api/admin/audit-log             Paginated audit log
```

---

## 7. Booking State Machine

```
                  ┌─────────────────────────────────────────────┐
                  │                                             │
    [Executor books slot + payment captured]                   │
                  │                                             │
                  ▼                                             │
           ┌────────────┐                                       │
           │ REQUESTED  │ ──────── Advisor decline ──────────► CANCELLED
           └────────────┘                                       │
                  │                                             │
         Advisor accepts (or auto-confirm if                   │
         requiresApproval=false)                               │
                  │                                             │
                  ▼                                             │
           ┌────────────┐                                       │
           │ CONFIRMED  │ ──── Cancel within policy ─────────► CANCELLED → REFUNDED
           └────────────┘                                       │
                  │                                             │
      Session time passes                                      │
                  │                                             │
          ┌───────┴───────┐                                     │
          │               │                                     │
    Marked               Marked                                │
    COMPLETED            NO_SHOW                               │
          │               │                                     │
          ▼               ▼                                     │
    ┌──────────┐   ┌──────────┐                                 │
    │COMPLETED │   │ NO_SHOW  │                                 │
    └──────────┘   └──────────┘                                 │
          │                                                     │
    Dispute opened                                              │
          │                                                     │
          ▼                                                     │
    ┌──────────────┐    Refund issued                           │
    │ IN_DISPUTE   │ ─────────────────────────────────────────► REFUNDED
    └──────────────┘    Release payment                         │
                   ─────────────────────────────────────────► COMPLETED

CANCELLED: Executor or Advisor cancels
REFUNDED: Payment reversed
NO_SHOW: Advisor marks executor did not appear (policy applies)
```

---

## 8. Concurrency & Double-Booking Prevention

```sql
-- Advisory lock pattern per advisor+slot
SELECT pg_advisory_xact_lock(hashtext(advisor_id || start_time::text));

-- Then check conflicts
SELECT id FROM bookings
WHERE advisor_id = $1
  AND status NOT IN ('CANCELLED', 'REFUNDED')
  AND start_time < $3  -- Requested end time
  AND end_time > $2;   -- Requested start time

-- If no conflict, INSERT booking
-- Lock auto-released on transaction commit/rollback
```

---

## 9. Availability Algorithm

1. Load advisor's `AvailabilityRule[]` for the requested day-of-week
2. Load `AvailabilityException[]` for the specific date
3. If exception is blackout → no slots
4. If exception has custom hours → use those instead of weekly rule
5. Generate slots: rule.startTime → rule.endTime at ratePlan.durationMinutes intervals, respecting bufferMinutes
6. Load existing bookings for the day (REQUESTED + CONFIRMED)
7. Remove conflicting slots (start, end + buffer)
8. Return remaining open slots
9. **Index strategy**: `(advisor_id, start_time)` B-tree index + partial index on `status IN ('REQUESTED','CONFIRMED')`

---

## 10. Indexing Strategy for 10K Advisors

```sql
-- Advisor search
CREATE INDEX idx_advisor_status ON advisor_profiles(status) WHERE status = 'APPROVED';
CREATE INDEX idx_advisor_specialties ON advisor_profiles USING gin(specialties);
CREATE INDEX idx_advisor_states ON advisor_profiles USING gin(states_served);
CREATE INDEX idx_advisor_hourly_rate ON advisor_profiles(hourly_rate);
CREATE INDEX idx_advisor_avg_rating ON advisor_profiles(avg_rating DESC NULLS LAST);

-- Booking conflict check (hot path)
CREATE INDEX idx_booking_advisor_time ON bookings(advisor_id, start_time, end_time)
  WHERE status IN ('REQUESTED', 'CONFIRMED');

-- Availability exceptions
CREATE INDEX idx_avail_exception_advisor_date ON availability_exceptions(advisor_id, date);

-- Admin queue
CREATE INDEX idx_advisor_pending ON advisor_profiles(status, created_at)
  WHERE status = 'PENDING_REVIEW';
```

---

## 11. Edge Cases & Handling

| Scenario | Handling |
|----------|---------|
| License expires after approval | Nightly cron checks `expiration_date < NOW()` → auto-PAUSED + email notification |
| Payment succeeds, booking insert fails | Stripe PaymentIntent captured; booking retry via idempotency key; auto-refund after 5 min if not resolved |
| Advisor pauses services | PAUSED: hide from search, existing CONFIRMED bookings kept active, REQUESTED bookings auto-declined |
| DST timezone shift | All times stored in UTC; display in user's local timezone via `Intl.DateTimeFormat` |
| Race condition on slot | pg_advisory_xact_lock per advisor+slot; SERIALIZABLE-level check |
| No-show policy | After session end + 15 min grace → allow advisor to mark NO_SHOW; configurable refund percent |
| Advisor cancels late | Policy fee charged; partial refund to executor based on `cancellationHours` |

---

## 12. UI Screens

### 12.1 Advisor Onboarding Wizard
**Route:** `/advisor/onboarding`  
**Steps:**
1. **Profile** — Name, bio, advisor type, specialties (multi-select), states served, languages
2. **Rates** — Base hourly rate + add service packages (name, duration, price)
3. **Availability** — Weekly schedule builder (day × time blocks), timezone, buffer, max sessions/day
4. **Documents** — Upload license docs with metadata (type, license#, state, expiry)
5. **Submit** — Review summary + submit for admin review

### 12.2 Advisor Dashboard
**Route:** `/advisor/dashboard`  
- Stats: Total bookings, earnings, pending, rating
- Upcoming sessions list
- Profile completeness bar
- Verification status badge

### 12.3 Advisor Directory
**Route:** `/marketplace`  
- Search + filters: specialty, state, price range, rating, availability window
- Advisor cards: avatar, name, type, specialties, rating, price, next available
- Pagination or infinite scroll

### 12.4 Advisor Profile Page
**Route:** `/marketplace/:advisorId`  
- Header: avatar, name, type, badges (Verified ✓)
- Bio, specialties, states served
- Rate plans list
- Live availability calendar (month view → day view → slot picker)
- Reviews section

### 12.5 Booking Checkout
**Route:** `/marketplace/:advisorId/book`  
- Selected service summary
- Intake questions (estate state, situation, goals, urgency)
- Payment (Stripe Elements)
- Confirmation

### 12.6 Admin Advisor Queue
**Route:** `/admin/advisors`  
- Table: name, type, submitted date, document status, action buttons
- Approve / Reject / Request Info / Pause

### 12.7 Admin Advisor Detail
**Route:** `/admin/advisors/:id`  
- Profile viewer
- Document viewer (signed URL preview)
- License metadata
- Action buttons
- Audit history for this advisor

### 12.8 Admin Audit Log
**Route:** `/admin/audit-log`  
- Filterable by action type, date range, admin
- Export CSV

---

## 13. Security Checklist

See `ADVISOR_MARKETPLACE_SECURITY.md`

---

## 14. Test Plan

See `ADVISOR_MARKETPLACE_TEST_PLAN.md`

---

## 15. Feature Flag

Enable via env var: `FEATURE_ADVISOR_MARKETPLACE=true`  
Sidebar + routes only rendered if flag is active. Backend routes always mounted but return 503 if flag disabled.
