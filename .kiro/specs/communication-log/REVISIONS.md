# Communication Log Spec Revisions

## Summary

This document tracks the technical revisions made to the Communication Log spec based on detailed technical review. The spec was assessed as ~80% ready for implementation, with 10 critical gaps identified and addressed.

## Revision Date

January 25, 2026

## Changes Made

### 1. ✅ Schema Fields Fully Specified

**Issue:** Communications table fields were underspecified with references to "all required fields" without explicit contract.

**Resolution:**
- Added complete field list to schema documentation
- Explicitly documented all columns with types and constraints
- Added TypeScript interface with all fields
- Clarified new fields: `occurredAt`, `institutionName`, `contactChannel`, `followUpCompletedAt`, `followUpCompletedBy`, `statusChangeEffectiveAt`

**Files Updated:**
- `design.md` - Database Schema section

---

### 2. ✅ Attachments Normalized to Separate Table

**Issue:** Original design mixed normalized and JSON approaches for attachments, creating brittleness.

**Resolution:**
- Created separate `communication_attachments` table
- Schema includes: `id`, `communication_id` (FK), `storage_key`, `file_name`, `mime_type`, `size_bytes`, `uploaded_by`, `created_at`
- Benefits: Easy delete/GC, easy query, safer concurrency, easier auditing
- CASCADE delete ensures attachments removed when communication deleted

**Files Updated:**
- `design.md` - Database Schema section
- `tasks.md` - Task 1.2 updated to create normalized table

---

### 3. ✅ Full-Text Search Explicitly Defined

**Issue:** Search implementation was vague, didn't commit to specific technology or behavior.

**Resolution:**
- **Committed to PostgreSQL FTS** with GIN indexes
- **Explicit search fields:** `subject`, `notes`, `institution_name`, `contact_name`
- **Tokenization:** Uses 'english' language configuration for stemming
- **Ranking:** Results ordered chronologically (occurred_at DESC), not by relevance
- **Filter Combination:** Search combines with filters using AND semantics
- **Attachment Search:** Phase 1 does NOT search filenames (can add in Phase 2)
- Added complete SQL examples for index creation and search queries

**Files Updated:**
- `design.md` - Added "Full-Text Search Implementation" section after indexes
- `design.md` - Updated "Technology Commitments" in Overview

---

### 4. ✅ Authorization and IDOR Protection Explicit

**Issue:** Authorization rules were mentioned but not explicitly defined with implementation details.

**Resolution:**
- **Rule 1:** Estate-based tenant isolation (users can only access their estates)
- **Rule 2:** Asset-estate validation prevents IDOR attacks (verify asset belongs to estate)
- **Rule 3:** Role-based deletion (executors/co-executors only)
- Added complete TypeScript implementation examples
- Added required authorization test cases
- **Decision:** Use 404 for GET requests (don't reveal existence), 403 for POST/PATCH/DELETE (clearer errors)

**Files Updated:**
- `design.md` - Expanded "Authorization and Tenant Isolation" section
- `tasks.md` - Task 6.3 updated with explicit IDOR test requirements

---

### 5. ✅ PII/Compliance Marked as Phase 2

**Issue:** Compliance features (encryption, redaction, audit) were missing from scope.

**Resolution:**
- Added "Out of Scope (Phase 2)" section at top of design doc
- Explicitly deferred: field-level encryption, redaction/masking, audit logging, retention policies, GDPR compliance
- Rationale: Core functionality must be validated before adding compliance complexity
- Phase 1 relies on: database-level encryption, standard auth, basic timestamps

**Files Updated:**
- `design.md` - Added "Out of Scope (Phase 2)" section after Overview

---

### 6. ✅ Transaction Boundaries Fully Defined

**Issue:** Concurrency handling was undefined, no clear transaction boundaries.

**Resolution:**
- **Create:** Wrap communication insert + asset last_contact update
- **Update:** Wrap in transaction ONLY if `occurredAt` changed (recalculate max date)
- **Delete:** Wrap communication delete + attachment cleanup + asset recalculation
- Added complete TypeScript implementation for all three operations
- Documented concurrency scenarios with timeline diagrams
- Acknowledged eventual consistency for last_contact_at (rare race condition, non-critical)
- Added required transaction test cases

**Files Updated:**
- `design.md` - Expanded "Transaction Boundaries" section with full implementations
- `tasks.md` - Tasks 3.1, 7.1, 7.6, 7.7 updated to specify transaction requirements

---

### 7. ✅ Follow-Up Completion Timestamped

**Issue:** Original design used boolean `followUpCompleted`, losing audit trail.

**Resolution:**
- Changed to `follow_up_completed_at` (TIMESTAMPTZ)
- Added `follow_up_completed_by` (UUID FK to users)
- UI can still show checkbox, but backend stores immutable completion record
- Status logic updated:
  - Overdue: `follow_up_due_at <= NOW() AND completed_at IS NULL`
  - Pending: `follow_up_due_at > NOW() AND completed_at IS NULL`
  - Completed: `completed_at IS NOT NULL`

**Files Updated:**
- `design.md` - Updated schema, TypeScript interfaces, status logic
- `tasks.md` - Task 10.1 updated to use timestamped completion

---

### 8. ✅ Count/Recent Endpoints Explicitly Defined

**Issue:** Dashboard widgets referenced counts and recent communications without explicit API endpoints.

**Resolution:**
- Added `GET /api/communications/recent` endpoint
  - Query params: `estateId` (required), `limit` (default 5, max 20)
  - Returns communications with asset context
  - Target p95 latency < 300ms
- Added `GET /api/assets/:id/communications/count` endpoint
  - Returns simple count
  - Target p95 latency < 200ms (indexed query)
- Alternative: Could use `GET /api/communications?limit=0` returning `totalCount`

**Files Updated:**
- `design.md` - Added explicit endpoint documentation
- `tasks.md` - Tasks 7.4, 7.5 reference new endpoints

---

### 9. ✅ Backend SLA Targets and Pagination Strategy

**Issue:** Performance targets were UI-focused, missing backend SLAs and pagination details.

**Resolution:**
- **Added p95 latency targets for all endpoints:**
  - POST /api/communications: < 500ms
  - GET /api/communications (50 items): < 800ms
  - GET /api/communications/:id: < 300ms
  - GET /api/communications/recent: < 300ms
  - GET /api/assets/:id/communications/count: < 200ms
  - PATCH /api/communications/:id: < 500ms
  - DELETE /api/communications/:id: < 800ms
  - POST attachments (5MB): < 3s
  - GET follow-ups: < 500ms
  - Full-text search: < 1s

- **Pagination Strategy:**
  - Cursor-based pagination (not offset)
  - Cursor encodes `(occurred_at, id)` for stable sorting
  - Avoids offset pagination issues with concurrent inserts
  - Default limit: 50, max limit: 100

- **Monitoring:**
  - Log queries > 1 second
  - Track p50, p95, p99 per endpoint
  - Alert on p95 > 2x target

**Files Updated:**
- `design.md` - Added "Backend SLA Targets" section in Error Handling
- `design.md` - Updated API endpoint documentation with latency targets

---

### 10. ✅ Integration Tests Added to Strategy

**Issue:** Testing strategy focused on property tests, missing critical integration tests.

**Resolution:**
- Added "Dual Testing Approach" section clarifying unit + property + integration tests
- **Required Integration Tests:**
  - Authorization wiring: Create → attach → delete → verify cleanup + recalculation
  - IDOR protection: User A cannot access User B's estate (403/404)
  - Asset-estate validation: Cannot create with asset from different estate
  - Transaction boundaries: Concurrent creates preserve correct max date
  - File upload: Real multipart parsing with size/type validation
  - Follow-up completion: Mark complete → verify removed from pending
  - Search accuracy: FTS returns correct results across indexed fields

- Updated testing checklist to include integration tests

**Files Updated:**
- `design.md` - Expanded "Testing Strategy" section
- `tasks.md` - Tasks 6.2, 6.3, 6.4, 8.4, 11.5 specify integration tests

---

## Implementation Readiness

**Status:** ✅ Ready for Implementation (100%)

All 10 critical gaps have been addressed with explicit technical decisions, implementation examples, and test requirements. The spec now provides:

1. ✅ Complete schema contracts for both tables
2. ✅ Normalized attachment storage model
3. ✅ Committed PostgreSQL FTS implementation
4. ✅ Explicit authorization rules and IDOR protection
5. ✅ Clear Phase 2 scope for compliance features
6. ✅ Comprehensive transaction boundaries with examples
7. ✅ Timestamped follow-up completion for audit trail
8. ✅ Explicit count/recent API endpoints
9. ✅ Backend SLA targets and cursor-based pagination
10. ✅ Integration test requirements alongside property tests

## Next Steps

1. Review revised spec with team
2. Begin implementation starting with Task 1 (database schema)
3. Follow bottom-up approach: DB → Services → API → UI
4. Run checkpoints at Tasks 6.5, 12, and 23 for validation

## Files Modified

- `.kiro/specs/communication-log/design.md` - Major revisions throughout
- `.kiro/specs/communication-log/tasks.md` - Updated task details for schema, transactions, tests
- `.kiro/specs/communication-log/REVISIONS.md` - This document (new)

## Approval

- [x] Technical gaps addressed
- [x] Implementation examples provided
- [x] Test requirements specified
- [ ] User review pending
- [ ] Ready to begin implementation
