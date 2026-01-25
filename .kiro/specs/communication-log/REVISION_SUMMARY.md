# Communication Log Spec Revision Summary

## Overview

This document summarizes the comprehensive revisions made to the Communication Log spec based on critical feedback. The spec is now production-ready with explicit technical decisions, security measures, and performance targets.

## Critical Gaps Addressed

### 1. ✅ Data Model Clarity - FIXED

**Problem**: Schema fields were underspecified, leading to potential implementation drift.

**Solution**:
- Added explicit SQL schema with all columns defined
- Renamed fields for clarity: `communicationDate` → `occurredAt`, `followUpDate` → `followUpDueAt`
- Added new fields: `institutionName`, `contactChannel`, `followUpCompletedAt`, `followUpCompletedBy`, `statusChangeEffectiveAt`
- Removed ambiguous fields: `contactTitle`, `contactPhone`, `contactEmail` → consolidated to `contactChannel`
- Added CHECK constraints for data integrity

### 2. ✅ Normalized Attachments - FIXED

**Problem**: Attachments stored as JSON array caused concurrency and cleanup issues.

**Solution**:
- Created separate `communication_attachments` table
- Schema: `id`, `communication_id`, `storage_key`, `file_name`, `mime_type`, `size_bytes`, `uploaded_by`, `created_at`
- CASCADE delete ensures cleanup
- Easier to query, audit, and manage

### 3. ✅ Full-Text Search Specification - FIXED

**Problem**: Search implementation was unclear.

**Solution**:
- Committed to PostgreSQL FTS with GIN index
- Explicit search fields: `subject`, `notes`, `institution_name`, `contact_name`
- Uses 'english' language configuration
- AND semantics for combining filters with search

### 4. ✅ Authorization and Tenant Isolation - FIXED

**Problem**: Authorization rules were not explicit, IDOR vulnerabilities possible.

**Solution**:
- Added `AuthorizationService` with explicit methods
- Estate-based tenant isolation: users can only access communications from their estates
- IDOR protection: validate `asset.estate_id` matches `communication.estate_id`
- Role-based deletion (optional): only executors can delete
- Added integration tests for authorization wiring and IDOR attempts

### 5. ✅ PII and Compliance - DEFERRED TO PHASE 2

**Problem**: Communications contain sensitive data (SSNs, account numbers).

**Solution**:
- Added "Out of Scope (Phase 2)" section in design document
- Explicitly deferred: field-level encryption, redaction/masking, audit logging, retention policies
- Phase 1 relies on: database-level encryption, standard auth, basic timestamps
- Rationale documented: validate core workflow before adding compliance complexity

### 6. ✅ Concurrency Handling - FIXED

**Problem**: Derived fields (`asset.last_contact_at`) could become inconsistent with concurrent operations.

**Solution**:
- All create/update/delete operations wrapped in transactions
- Asset `last_contact_at` updated within same transaction
- Optimistic locking with `updated_at` timestamp
- Added concurrency scenario documentation
- Added integration test for concurrent creates

### 7. ✅ Follow-Up Completion Timestamped - FIXED

**Problem**: Boolean `followUpCompleted` doesn't provide audit trail.

**Solution**:
- Changed to `followUpCompletedAt` (timestamptz) and `followUpCompletedBy` (user_id)
- UI can still show checkbox, backend stores immutable completion record
- Status logic: overdue if `due_at <= NOW() AND completed_at IS NULL`

### 8. ✅ Count and Recent Endpoints - FIXED

**Problem**: Missing explicit endpoints for dashboard widgets.

**Solution**:
- Added `GET /api/communications/recent?estateId=X&limit=5`
- Added `GET /api/assets/:id/communications/count`
- Defined performance targets: < 300ms for recent, < 200ms for count
- Specified return types with asset context

### 9. ✅ Backend SLA Targets - FIXED

**Problem**: Performance requirements were vague.

**Solution**:
- Added explicit p95 latency targets for all endpoints
- Cursor-based pagination strategy (not offset) for consistency
- Query timeout: 5 seconds
- Monitoring requirements: log slow queries, track p50/p95/p99, alert on degradation

### 10. ✅ Integration Tests - FIXED

**Problem**: Property tests don't catch authorization wiring, transaction boundaries, or file upload edge cases.

**Solution**:
- Added integration test requirements to tasks
- Critical tests: authorization wiring, IDOR protection, asset-estate validation, concurrent operations, file upload with real multipart parsing
- Updated testing checklist to include integration tests

## Schema Changes Summary

### Communications Table (Before → After)

**Removed Fields**:
- `contactTitle` (rarely used, consolidated)
- `contactPhone` (consolidated to `contactChannel`)
- `contactEmail` (consolidated to `contactChannel`)
- `communicationDate` (renamed to `occurredAt`)
- `followUpDate` (renamed to `followUpDueAt`)
- `followUpCompleted` (changed to timestamped completion)
- `attachments` (moved to separate table)

**Added Fields**:
- `occurred_at` (timestamptz, renamed from `communicationDate`)
- `institution_name` (may differ from asset's institution)
- `contact_channel` (email or phone, consolidated field)
- `follow_up_due_at` (timestamptz, renamed from `followUpDate`)
- `follow_up_completed_at` (timestamptz, replaces boolean)
- `follow_up_completed_by` (user_id, audit trail)
- `status_change_effective_at` (timestamptz, when status changed)

**New Table**: `communication_attachments`
- Normalized storage for file metadata
- CASCADE delete on communication deletion
- CHECK constraints for file size and MIME type

## API Changes Summary

### New Endpoints

1. `GET /api/communications/recent` - Dashboard widget
2. `GET /api/assets/:id/communications/count` - Asset badge count

### Modified Endpoints

1. `GET /api/communications` - Cursor-based pagination (not offset)
2. `PATCH /api/communications/:id` - Accept `followUpCompletedAt` (not boolean)
3. All endpoints - Added p95 latency targets

## Service Layer Changes

### New Services

1. `AuthorizationService` - Estate access, IDOR protection, role checks

### Modified Services

1. `CommunicationService` - Cursor pagination, transaction support, `getRecent()` method
2. `FollowUpService` - Timestamped completion, `completeFollowUp(userId)` signature
3. `FileService` - `deleteAllFiles()` method for communication deletion
4. `AssetService` - Transaction-aware methods

## Task Changes Summary

### Task 1 (Database Schema)
- Split into 5 sub-tasks with explicit schema definitions
- Added CHECK constraints and foreign keys
- Specified PostgreSQL FTS configuration

### Task 6 (New)
- Added authorization service implementation
- Added integration tests for IDOR, transactions, concurrency

### Task 7 (API Endpoints)
- Added new endpoints (recent, count)
- Added p95 latency targets
- Specified cursor pagination strategy

### Task 11 (Follow-Ups)
- Added integration test for follow-up completion
- Updated to use timestamped completion

### Task 23 (Final Checkpoint)
- Added integration test verification
- Added performance target verification
- Added cursor pagination testing

## Performance Targets (p95 Latency)

| Endpoint | Target |
|----------|--------|
| POST /api/communications | < 500ms |
| GET /api/communications (50 items) | < 800ms |
| GET /api/communications/:id | < 300ms |
| GET /api/communications/recent | < 300ms |
| GET /api/assets/:id/communications/count | < 200ms |
| PATCH /api/communications/:id | < 500ms |
| DELETE /api/communications/:id | < 800ms |
| POST /api/communications/:id/attachments (5MB) | < 3s |
| GET /api/communications/follow-ups | < 500ms |
| Full-text search | < 1s |

## Testing Strategy Updates

### Before
- Unit tests + Property-based tests

### After
- Unit tests + Property-based tests + **Integration tests**
- Integration tests cover: authorization, IDOR, transactions, concurrency, file upload
- Explicit test cases for edge cases: concurrent creates, edit to older date, etc.

## Implementation Readiness

### Before Revision: ~80% Ready
- Missing schema details
- Unclear authorization
- No concurrency handling
- Vague performance targets

### After Revision: 100% Ready ✅
- ✅ Explicit schema with all fields
- ✅ Normalized attachments
- ✅ PostgreSQL FTS specified
- ✅ Authorization rules defined
- ✅ IDOR protection specified
- ✅ Transaction boundaries documented
- ✅ Timestamped follow-up completion
- ✅ Count/recent endpoints added
- ✅ p95 latency targets defined
- ✅ Cursor pagination strategy
- ✅ Integration tests required
- ✅ PII/compliance deferred with rationale

## Next Steps

The spec is now ready for implementation. Start with Task 1 (database schema) and proceed sequentially through the tasks. All critical gaps have been addressed, and the implementation path is clear.

**Key Success Criteria**:
1. All property tests pass (100+ iterations)
2. All unit tests pass
3. All integration tests pass (authorization, IDOR, transactions)
4. p95 latencies meet targets
5. Cursor pagination works with concurrent inserts
6. Database migrations tested (up and down)

---

**Revision Date**: January 24, 2026
**Status**: Ready for Implementation ✅
