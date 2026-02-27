# AuthorityType Change Policy Implementation

## Overview

This document describes the implementation of the AuthorityType Change Policy and AuthorityScope Gating system, designed to prevent trust/probate module leakage with pinning stability, explicit repin workflows, and comprehensive audit logging.

## Problem Statement

Previously, the system could incorrectly display:
- Trust-specific tasks (e.g., "Identify Successor Trustee") for probate estates
- Probate-specific tasks (e.g., "File Probate Petition") for trust estates
- State-specific tasks from other states (e.g., CA IAEA tasks for NY estates)

This created:
- User confusion and potential legal errors
- Audit trail gaps when authority type changed
- No mechanism to "pin" a roadmap to a specific authority type

## Solution Architecture

### 1. Schema Layer

Added to `Estate` model:
- `authorityTypeSource` - Source of authority type ("ENGINE" | "MANUAL" | "PINNED")
- `authorityPinnedAt` - When authority was pinned
- `authorityChangePending` - Flag for pending changes
- `recommendedAuthorityType` - Engine recommendation when different from pinned
- `recommendedAuthorityReason` - JSON with reason for recommendation

Created `AuthorityChangeEvent` model for audit trail:
- Tracks all authority type changes
- Includes diff summary of affected tasks
- Supports revert workflow

### 2. Task Model Layer

Added `authorityScope` field to `PhaseTask`:
- `"PROBATE"` - Only shows for probate estates
- `"TRUST"` - Only shows for trust estates
- `"BOTH"` - Shows for both (default for backward compatibility)

Tagged key tasks:
```typescript
// PROBATE-only tasks
{ id: "file_probate_petition", authorityScope: "PROBATE" }
{ id: "attend_probate_hearing", authorityScope: "PROBATE" }
{ id: "receive_letters_testamentary", authorityScope: "PROBATE" }

// TRUST-only tasks
{ id: "locate_trust", authorityScope: "TRUST" }
{ id: "identify_successor_trustee", authorityScope: "TRUST" }
{ id: "prepare_certification_of_trust", authorityScope: "TRUST" }

// BOTH tasks (default)
{ id: "secure_property", authorityScope: "BOTH" }
{ id: "pay_taxes", authorityScope: "BOTH" }
```

### 3. Filter Layer

Enhanced `filterByJurisdiction.ts`:

```typescript
export function filterTasksByAuthorityScope<T extends ScopedTask>(
  tasks: T[],
  estateAuthorityType: EstateAuthorityType
): AuthorityScopeFilterResult<T>
```

Fail-closed rules:
1. Tasks without `authorityScope` → default to "BOTH" (backward compatibility)
2. `authorityScope = "BOTH"` → always visible
3. `authorityScope = "PROBATE"` → visible only if estate is PROBATE or BOTH
4. `authorityScope = "TRUST"` → visible only if estate is TRUST or BOTH
5. Unknown values → DROP (fail-closed)

### 4. Service Layer

Created `authorityChangeService.ts`:

```typescript
// Compute recommendation without mutation
export async function computeAuthorityRecommendation(estateId: string): Promise<AuthorityRecommendationResult>

// Preview repin impact
export async function getRepinPreview(estateId: string): Promise<RepinPreviewResult>

// Pin authority type
export async function pinAuthorityType(estateId: string, userId: string): Promise<...>

// Repin with confirmation workflow
export async function repinAuthorityType(estateId: string, userId: string, confirm: boolean): Promise<...>

// Check if authority has drifted
export async function checkAuthorityChangePending(estateId: string): Promise<boolean>

// Audit logging
export async function logAuthorityChangeEvent(params: {...}): Promise<string>
```

### 5. API Layer

Added endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/estates/:id/repinPreview` | Preview what would change if repinned |
| POST | `/api/estates/:id/pin` | Pin current authority type |
| POST | `/api/estates/:id/repin` | Repin with confirmation |
| GET | `/api/estates/:id/authorityHistory` | Get audit trail |

### 6. Repin Confirmation Workflow

```
┌─────────────────┐
│ Estate Profile  │
│ Changes         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Compute New     │
│ Recommendation  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    No     ┌─────────────────┐
│ Authority       │──────────▶│ No Action       │
│ Changed?        │           │ Required        │
└────────┬────────┘           └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Set             │
│ authorityChange │
│ Pending = true  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Requests   │
│ Repin Preview   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    No     ┌─────────────────┐
│ Completed Tasks │──────────▶│ Auto-allow      │
│ Affected?       │           │ Repin           │
└────────┬────────┘           └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Require         │
│ Confirmation    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    No     ┌─────────────────┐
│ User Confirms?  │──────────▶│ Block Repin     │
└────────┬────────┘           └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Execute Repin   │
│ Log Audit Event │
└─────────────────┘
```

## API Response Examples

### Repin Preview Response
```json
{
  "currentAuthorityType": "FORMAL_PROBATE",
  "recommendedAuthorityType": "TRUST_ADMIN_REVOCABLE",
  "estateAuthorityType": "PROBATE",
  "recommendedEstateAuthorityType": "TRUST",
  "changeReason": "Trust document discovered during asset scan",
  "tasksAdded": ["locate_trust", "identify_successor_trustee", "prepare_certification_of_trust"],
  "tasksRemoved": ["file_probate_petition", "attend_probate_hearing"],
  "completionImpact": {
    "affectedTasks": 5,
    "completedTasksAffected": 1,
    "canMigrate": false
  },
  "requiresConfirmation": true,
  "diffSummary": {
    "added": [
      {"id": "locate_trust", "title": "Locate Trust Document"},
      {"id": "identify_successor_trustee", "title": "Identify Successor Trustee"}
    ],
    "removed": [
      {"id": "file_probate_petition", "title": "File Probate Petition"}
    ]
  }
}
```

### Roadmap Response with Authority Change Pending
```json
{
  "estateId": "estate-123",
  "phases": [...],
  "triggers": {...},
  "profile": {...},
  "version": "1.0.0",
  "pinnedAt": "2025-01-15T10:00:00Z",
  "authorityChangePending": true,
  "requiresRepin": true,
  "recommendedAuthorityType": "TRUST_ADMIN_REVOCABLE",
  "recommendedEstateAuthorityType": "TRUST"
}
```

## Database Migration

Run the migration to add the new fields:

```bash
npx prisma migrate dev --name add_authority_change_policy
```

## Testing

### Unit Tests
- `tests/authority_scope_audit.test.ts` - Authority scope filtering tests
- `tests/washington_authority_regression.test.ts` - State-specific regression tests

### Integration Tests
- Verify trust tasks don't appear for probate estates
- Verify probate tasks don't appear for trust estates
- Verify repin confirmation workflow
- Verify audit trail logging

## Best Practices

1. **Always Pin Authority** - After initial estate setup, pin the authority type to prevent unexpected changes

2. **Review Repin Previews** - Before confirming a repin, carefully review the preview to understand impact

3. **Monitor Audit Trail** - Use `/api/estates/:id/authorityHistory` to track authority changes

4. **Handle BOTH Estates** - Estates with both trust and probate assets show all tasks; be aware this may include irrelevant tasks

5. **State Contamination** - The system includes safeguards to prevent CA-specific tasks from appearing in other states

## Future Enhancements

1. **Task Migration Map** - When repinning with completed tasks, provide a mapping to equivalent tasks in new authority track

2. **Automatic Detection** - Automatically detect authority changes when new assets are added

3. **Advisor Review Triggers** - Alert advisors when authority type changes for estates they're monitoring

4. **Bulk Repin** - Allow advisors to repin multiple estates at once for batch corrections
