# Fix for Registration and Onboarding 400 Errors - CountyOverride Model

## Problem
The application was experiencing 400 errors during registration and onboarding when attempting to fetch roadmaps. The root cause was that the `CountyOverrideService` was trying to query the `county_overrides` table, but the table didn't exist in the database.

## Root Cause
The `CountyOverride` model was defined in the Prisma schema (`prisma/schema.prisma`), but there was no corresponding database migration to create the `county_overrides` table. Additionally, the `estates` table was missing three columns needed for county override pinning:
- `state_ruleset_hash`
- `county_override_id`
- `county_override_hash`

## Solution
Created a new Prisma migration: `20260128000000_add_county_overrides/migration.sql`

### What the migration does:

1. **Creates `update_updated_at_column` function** (if not exists)
   - PostgreSQL trigger function to automatically update `updated_at` timestamps

2. **Adds county override fields to `estates` table**
   - `state_ruleset_hash` TEXT - Stores hash of state ruleset for pinning
   - `county_override_id` TEXT - Reference to county override ID
   - `county_override_hash` TEXT - Hash of county overrides for drift detection

3. **Creates `county_overrides` table**
   - `id` UUID (primary key)
   - `state_code` TEXT (NOT NULL)
   - `county_name` TEXT (NOT NULL)
   - `task_id` TEXT (NOT NULL)
   - Whitelisted override fields:
     - `title` TEXT (optional)
     - `description` TEXT (optional)
     - `fee_amount` DECIMAL(12,2) (optional)
     - `primary_action_url` TEXT (optional)
     - `form_names` TEXT[] (array, defaults to {})
     - `attachments` JSONB (optional)
   - Internal tracking fields:
     - `created_at` TIMESTAMP WITH TIME ZONE
     - `updated_at` TIMESTAMP WITH TIME ZONE
     - `published_at` TIMESTAMP WITH TIME ZONE (optional)
   - Unique constraint on `(state_code, county_name, task_id)`

4. **Creates indexes for performance**
   - `idx_county_overrides_state_county` on `(state_code, county_name)`
   - `idx_county_overrides_task` on `(task_id)`

5. **Creates trigger to auto-update `updated_at`**
   - Automatically updates the `updated_at` field on row updates

## Files Changed
- **Created**: `prisma/migrations/20260128000000_add_county_overrides/migration.sql`
- **No changes needed**: `prisma/schema.prisma` (CountyOverride model already exists)

## How to Apply the Migration

### Development/Local
```bash
# If using Prisma Migrate
npx prisma migrate dev --name add_county_overrides

# Or apply the migration directly
psql $DATABASE_URL -f prisma/migrations/20260128000000_add_county_overrides/migration.sql
```

### Production (Neon)
1. The migration file will be detected by the deployment process
2. Ensure the migration is applied before deploying the code that uses `CountyOverrideService`

## Verification

After applying the migration, verify the table exists:

```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'county_overrides';

-- Check columns exist
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'county_overrides';

-- Check estates table has new columns
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'estates' 
  AND column_name IN ('state_ruleset_hash', 'county_override_id', 'county_override_hash');
```

## Impact

This fix resolves:
- ✅ 400 errors during registration when roadmaps are fetched
- ✅ 400 errors during onboarding when roadmaps are generated
- ✅ Enables county-specific task overrides (title, description, fees, forms, attachments)
- ✅ Supports roadmap versioning with county override pinning
- ✅ Allows drift detection for county overrides

## Related Code
- `server/services/countyOverrideService.ts` - Service that queries county_overrides
- `server/services/roadmapService.ts` - Uses CountyOverrideService
- `server/routes/estateRoutes.ts` - API endpoints that trigger roadmap generation
- `prisma/schema.prisma` - Contains CountyOverride model definition

## Testing
Test file: `src/tests/roadmap/county_overrides.test.ts`
- Tests override application to whitelisted fields
- Tests hash generation for pinning
- Tests fail-safe behavior on database errors
