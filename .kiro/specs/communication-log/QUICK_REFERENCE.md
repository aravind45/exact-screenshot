# Communication Log - Quick Reference

## Database Schema (PostgreSQL)

### communications table
```sql
id                          UUID PRIMARY KEY
estate_id                   UUID FK → estates (CASCADE)
asset_id                    UUID FK → assets (CASCADE)
type                        VARCHAR(20) CHECK (call|email|letter|fax|in-person)
direction                   VARCHAR(10) CHECK (inbound|outbound)
occurred_at                 TIMESTAMPTZ CHECK (<= NOW())
institution_name            VARCHAR(255)
contact_name                VARCHAR(255)
contact_channel             VARCHAR(255)
subject                     VARCHAR(500)
notes                       TEXT NOT NULL
follow_up_due_at            TIMESTAMPTZ CHECK (> occurred_at)
follow_up_completed_at      TIMESTAMPTZ
follow_up_completed_by      UUID FK → users
status_change               VARCHAR(50) CHECK (enum values)
status_change_effective_at  TIMESTAMPTZ
created_at                  TIMESTAMPTZ DEFAULT NOW()
updated_at                  TIMESTAMPTZ DEFAULT NOW()
created_by                  UUID FK → users
```

### communication_attachments table
```sql
id                UUID PRIMARY KEY
communication_id  UUID FK → communications (CASCADE)
storage_key       VARCHAR(500) NOT NULL
file_name         VARCHAR(255) NOT NULL
mime_type         VARCHAR(100) CHECK (allowed types)
size_bytes        INTEGER CHECK (> 0 AND <= 10485760)
uploaded_by       UUID FK → users
created_at        TIMESTAMPTZ DEFAULT NOW()
```

## Indexes

```sql
-- Foreign keys
CREATE INDEX idx_communications_estate_id ON communications(estate_id);
CREATE INDEX idx_communications_asset_id ON communications(asset_id);
CREATE INDEX idx_communication_attachments_communication_id ON communication_attachments(communication_id);

-- Query optimization
CREATE INDEX idx_communications_occurred_at ON communications(occurred_at DESC);
CREATE INDEX idx_communications_follow_up ON communications(follow_up_due_at) 
  WHERE follow_up_completed_at IS NULL;

-- Full-text search (PostgreSQL GIN)
CREATE INDEX idx_communications_search ON communications 
  USING gin(to_tsvector('english', 
    coalesce(subject, '') || ' ' || 
    coalesce(notes, '') || ' ' || 
    coalesce(institution_name, '') || ' ' || 
    coalesce(contact_name, '')
  ));

-- Composite indexes
CREATE INDEX idx_communications_estate_occurred ON communications(estate_id, occurred_at DESC);
CREATE INDEX idx_communications_asset_occurred ON communications(asset_id, occurred_at DESC);
```

## API Endpoints

| Method | Endpoint | Auth | p95 Target |
|--------|----------|------|------------|
| POST | `/api/communications` | Estate access + IDOR check | < 500ms |
| GET | `/api/communications` | Estate access | < 800ms |
| GET | `/api/communications/:id` | Estate access | < 300ms |
| GET | `/api/communications/recent` | Estate access | < 300ms |
| GET | `/api/assets/:id/communications/count` | Estate access | < 200ms |
| PATCH | `/api/communications/:id` | Estate access | < 500ms |
| DELETE | `/api/communications/:id` | Estate + role check | < 800ms |
| POST | `/api/communications/:id/attachments` | Estate access | < 3s |
| DELETE | `/api/communications/:id/attachments/:attachmentId` | Estate access | - |
| GET | `/api/communications/follow-ups` | Estate access | < 500ms |

## Authorization Rules

1. **Estate Access**: User must be member of estate
2. **IDOR Protection**: Verify `asset.estate_id == communication.estate_id`
3. **Role-Based Delete**: Only executor/co-executor can delete

```typescript
// Check estate access
SELECT role FROM estate_members WHERE user_id = $1 AND estate_id = $2

// Validate asset belongs to estate (IDOR protection)
SELECT estate_id FROM assets WHERE id = $assetId
// Must match $estateId

// Check delete permission
SELECT role FROM estate_members WHERE user_id = $1 AND estate_id = $2
// role IN ('executor', 'co-executor')
```

## Transaction Boundaries

### Create
```typescript
BEGIN TRANSACTION
  INSERT INTO communications (...)
  UPDATE assets SET last_contact_at = $occurredAt WHERE id = $assetId
COMMIT
```

### Update (if date changed)
```typescript
BEGIN TRANSACTION
  UPDATE communications SET occurred_at = $newDate WHERE id = $id
  SELECT MAX(occurred_at) FROM communications WHERE asset_id = $assetId
  UPDATE assets SET last_contact_at = $maxDate WHERE id = $assetId
COMMIT
```

### Delete
```typescript
BEGIN TRANSACTION
  DELETE FROM communications WHERE id = $id  -- CASCADE deletes attachments
  SELECT MAX(occurred_at) FROM communications WHERE asset_id = $assetId
  UPDATE assets SET last_contact_at = $maxDate WHERE id = $assetId
COMMIT
// Also delete files from S3 (idempotent, outside transaction)
```

## Search Query (PostgreSQL FTS)

```sql
SELECT * FROM communications
WHERE estate_id = $1
  AND to_tsvector('english', 
    coalesce(subject, '') || ' ' || 
    coalesce(notes, '') || ' ' || 
    coalesce(institution_name, '') || ' ' || 
    coalesce(contact_name, '')
  ) @@ plainto_tsquery('english', $2)
ORDER BY occurred_at DESC, id DESC
LIMIT 50;
```

## Pagination (Cursor-Based)

```typescript
// Cursor encodes (occurred_at, id)
const cursor = btoa(JSON.stringify({ 
  occurred_at: lastItem.occurredAt, 
  id: lastItem.id 
}));

// Next page query
SELECT * FROM communications
WHERE estate_id = $1
  AND (occurred_at, id) < ($cursorDate, $cursorId)
ORDER BY occurred_at DESC, id DESC
LIMIT 50;
```

## Follow-Up Status Logic

```typescript
function getFollowUpStatus(dueAt: Date, completedAt: Date | null): string {
  if (completedAt !== null) return 'completed';
  if (dueAt <= new Date()) return 'overdue';
  return 'pending';
}

// Pending query
WHERE follow_up_completed_at IS NULL AND follow_up_due_at > NOW()

// Overdue query
WHERE follow_up_completed_at IS NULL AND follow_up_due_at <= NOW()

// Complete action
UPDATE communications 
SET follow_up_completed_at = NOW(), 
    follow_up_completed_by = $userId
WHERE id = $id
```

## File Upload Validation

```typescript
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

function validateFile(file: File): { valid: boolean; errors: string[] } {
  const errors = [];
  if (file.size > MAX_SIZE) errors.push('File exceeds 10MB limit');
  if (!ALLOWED_TYPES.includes(file.type)) errors.push('Unsupported file type');
  return { valid: errors.length === 0, errors };
}
```

## Error Responses

| Status | When | Response |
|--------|------|----------|
| 400 | Validation error | `{ error: "Validation Error", details: [...] }` |
| 403 | Unauthorized (POST/PATCH/DELETE) | `{ error: "Forbidden: ..." }` |
| 404 | Not found or unauthorized (GET) | `{ error: "Not Found" }` |
| 409 | Concurrent modification | `{ error: "Conflict", message: "..." }` |
| 413 | File too large | `{ error: "File Upload Error", maxSize: 10485760 }` |
| 415 | Unsupported file type | `{ error: "File Upload Error", message: "..." }` |

## Testing Checklist

- [ ] 36 property tests (100+ iterations each)
- [ ] Unit tests for edge cases and validation
- [ ] Integration test: Create → attach → delete → verify cleanup
- [ ] Integration test: IDOR protection (cross-estate blocked)
- [ ] Integration test: Concurrent creates preserve max date
- [ ] Integration test: File upload with real multipart
- [ ] Integration test: Follow-up completion timestamp
- [ ] Performance: All endpoints meet p95 targets
- [ ] Database migrations (up and down)

## Common Queries

```sql
-- Get communications for asset
SELECT * FROM communications 
WHERE asset_id = $1 
ORDER BY occurred_at DESC, id DESC 
LIMIT 50;

-- Get communication count for asset
SELECT COUNT(*) FROM communications WHERE asset_id = $1;

-- Get recent communications for estate
SELECT c.*, a.name as asset_name, a.institution 
FROM communications c
JOIN assets a ON c.asset_id = a.id
WHERE c.estate_id = $1
ORDER BY c.occurred_at DESC, c.id DESC
LIMIT 5;

-- Get pending follow-ups
SELECT c.*, a.name as asset_name, a.institution
FROM communications c
JOIN assets a ON c.asset_id = a.id
WHERE c.estate_id = $1
  AND c.follow_up_completed_at IS NULL
  AND c.follow_up_due_at IS NOT NULL
ORDER BY 
  CASE WHEN c.follow_up_due_at <= NOW() THEN 0 ELSE 1 END,
  c.follow_up_due_at ASC;
```

## Implementation Order

1. Database schema + migrations (Task 1)
2. TypeScript interfaces (Task 2.1)
3. Validation functions (Task 2.4)
4. CommunicationService (Task 3.1)
5. AssetService integration (Task 4.1)
6. FileService (Task 5.1)
7. AuthorizationService (Task 6.1)
8. Integration tests (Tasks 6.2-6.4)
9. API endpoints (Tasks 7-8)
10. Search + filters (Task 9)
11. FollowUpService (Task 10)
12. Follow-up endpoints (Task 11)
13. UI components (Tasks 13-21)
14. Dashboard integration (Task 21)
15. Real-time updates (Task 22)
16. End-to-end testing (Task 23)

---

**Start here:** Task 1.1 - Create communications table
