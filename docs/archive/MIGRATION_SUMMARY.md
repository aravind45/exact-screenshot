# CountyOverride Migration Fix - Summary

## Changes Made

### 1. Created Database Migration
**File**: `prisma/migrations/20260128000000_add_county_overrides/migration.sql`

This migration:

1. **Creates trigger function** `update_updated_at_column()` for automatic timestamp updates

2. **Adds columns to `estates` table**:
   - `state_ruleset_hash` TEXT - For SSOT pinning
   - `county_override_id` TEXT - Reference to county override
   - `county_override_hash` TEXT - Hash for drift detection

3. **Creates `county_overrides` table** with:
   - Primary key: `id` (UUID)
   - Fields: `state_code`, `county_name`, `task_id`
   - Whitelisted override fields: `title`, `description`, `fee_amount`, `primary_action_url`, `form_names`, `attachments`
   - Timestamps: `created_at`, `updated_at`, `published_at`
   - Unique constraint: `(state_code, county_name, task_id)`

4. **Creates indexes**:
   - `idx_county_overrides_state_county` on `(state_code, county_name)`
   - `idx_county_overrides_task` on `(task_id)`

5. **Creates trigger** `update_county_overrides_updated_at` to auto-update timestamps

### 2. Documentation
**File**: `COUNTY_OVERRIDE_FIX.md`

Comprehensive documentation including:
- Problem description
- Root cause analysis
- Solution details
- Migration application instructions
- Verification queries
- Impact analysis

## Problem Solved

The application was experiencing **400 errors** during registration and onboarding when:
- Users registered a new estate
- Onboarding generated a roadmap
- `CountyOverrideService` attempted to query the `county_overrides` table

**Root Cause**: The `CountyOverride` model existed in Prisma schema but no database migration had been applied to create the table.

## After Applying Migration

Once this migration is applied to the database:
- ✅ CountyOverrideService can successfully query `county_overrides` table
- ✅ Roadmap generation works without 400 errors
- ✅ County-specific task overrides are supported
- ✅ Roadmap versioning with county override pinning is enabled
- ✅ Drift detection for county overrides is available

## How to Apply

```bash
# Option 1: Using Prisma Migrate (recommended)
npx prisma migrate dev --name add_county_overrides

# Option 2: Direct SQL application
psql $DATABASE_URL -f prisma/migrations/20260128000000_add_county_overrides/migration.sql

# Option 3: Using Neon CLI
npx prisma db push
```

## Verification

After applying, verify with:

```sql
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'county_overrides';

-- Check new columns on estates table
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'estates' 
  AND column_name IN ('state_ruleset_hash', 'county_override_id', 'county_override_hash');
```

## Related Files

- `prisma/schema.prisma` - Contains CountyOverride model (lines 1161-1182)
- `server/services/countyOverrideService.ts` - Uses db.countyOverride.findMany()
- `server/services/roadmapService.ts` - Calls CountyOverrideService
- `server/routes/estateRoutes.ts` - API endpoint `/api/estates/:id/roadmap`
- `src/tests/roadmap/county_overrides.test.ts` - Unit tests for CountyOverrideService
