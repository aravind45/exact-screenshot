# Database Migration Defensive Changes

## Problem
The production database is experiencing 500 errors because the migration adding `authority_scope` and `estate_authority_type` columns hasn't been applied yet. The Prisma queries fail when trying to read/write columns that don't exist in the database.

## Solution
Made the code defensive to handle missing database columns gracefully. The application will continue to work even if the migration hasn't been applied, with appropriate warning logs.

## Changes Made

### 1. `getRoadmapFromDatabase()` - Settlement Type Query Defense
**Location:** Lines 909-940

Added try-catch around the settlement type query that includes tasks with the `authority_scope` column. If the query fails due to missing columns, it falls back to hardcoded tasks.

```typescript
try {
  settlementType = await (db.settlementType as any).findUnique({...});
} catch (error) {
  logger.warn({
    estateId,
    settlementTypeCode,
    error: error instanceof Error ? error.message : String(error)
  }, "Failed to fetch settlement type - likely due to missing migration. Falling back to hardcoded tasks.");

  // Fallback to hardcoded tasks if query fails
  const injected = ensurePreFilingCompliance(SETTLEMENT_PHASE_TASKS, profile);
  const filtered = filterTasksForEstate(injected, profile, completedTaskIds);
  const caGuarded = removeCAOnlyTasks(filtered, profile.state);
  return normalizePhasesForState(caGuarded, profile.state);
}
```

### 2. `getRoadmapFromDatabase()` - AuthorityScope Filtering Defense
**Location:** Lines 1031-1062

Wrapped the `filterPhasesByAuthorityScope()` call in a try-catch block. If the filtering fails (e.g., due to missing `authorityScope` data), it falls back to using unfiltered phases.

```typescript
try {
  const filterResult = filterPhasesByAuthorityScope(
    scopeFiltered as unknown as PhaseLike<PhaseTask>[],
    profile.estateAuthorityType
  );
  authorityFiltered = filterResult.phases;
  authorityDropped = filterResult.dropped;

  // Log dropped tasks for audit trail
  if (authorityDropped.length > 0) {
    logger.info({...}, "Authority scope filtering applied");
  }
} catch (error) {
  // Fallback: if authorityScope filtering fails (e.g., migration not applied), use unfiltered phases
  logger.warn({...}, "AuthorityScope filtering disabled - migration may be pending. Using unfiltered phases.");
  authorityFiltered = scopeFiltered as unknown as PhaseLike<PhaseTask>[];
  authorityDropped = [];
}
```

### 3. `pinEstateRoadmap()` - Estate Authority Type Update Defense
**Location:** Lines 1204-1246

Added try-catch around the estate update that sets `estateAuthorityType`. If the update fails due to missing column, it retries the update without that field.

```typescript
try {
  await db.estate.update({
    where: { id: estateId },
    data: {
      // ... other fields
      estateAuthorityType,
      // ... other fields
    }
  });
} catch (error) {
  // Fallback: if estateAuthorityType column doesn't exist, try without it
  logger.warn({...}, "Failed to update estateAuthorityType - migration may be pending. Retrying without estateAuthorityType.");

  await db.estate.update({
    where: { id: estateId },
    data: {
      // ... same fields WITHOUT estateAuthorityType
    }
  });
}
```

### 4. `getRoadmapFromDatabase()` - Task Mapping Update
**Location:** Line 976

Added explicit mapping of `authorityScope` from database tasks with a defensive comment explaining it may be undefined if migration not applied.

```typescript
return {
  id: task.taskCode,
  scope: task.scope || 'CORE',
  allowedStates: task.applicableStates && task.applicableStates.length > 0 ? task.applicableStates : undefined,
  allowedCounties: task.allowedCounties && task.allowedCounties.length > 0 ? task.allowedCounties : undefined,
  authorityScope: task.authorityScope, // May be undefined if migration not applied
  // ... rest of task fields
};
```

## Behavior After Changes

### When Migration IS Applied:
- Full authorityScope filtering works as designed
- `estateAuthorityType` is correctly stored and retrieved
- No warnings in logs
- Trust/probate module leakage is properly prevented

### When Migration is NOT Applied:
- App continues to function without errors
- Falls back to hardcoded tasks if database query fails
- AuthorityScope filtering is skipped (shows all tasks)
- `estateAuthorityType` is not stored (but doesn't cause errors)
- Clear warning messages logged for monitoring
- Once migration is applied, full functionality automatically resumes

## Monitoring

Watch for these log messages:
- `"Failed to fetch settlement type - likely due to missing migration"` - Database query failed
- `"AuthorityScope filtering disabled - migration may be pending"` - Filtering skipped
- `"Failed to update estateAuthorityType - migration may be pending"` - Update skipped

## Next Steps

1. Apply the database migration to production when ready
2. Verify warning messages stop appearing
3. Confirm authorityScope filtering is working correctly
4. Consider removing defensive code after migration is verified stable (optional - can keep for extra safety)
