-- Add completeness_level column to estates table
-- Possible values: UNSET | MINIMUM_READY | PROFILE_READY
ALTER TABLE "estates"
  ADD COLUMN IF NOT EXISTS "completeness_level" TEXT NOT NULL DEFAULT 'UNSET';

-- Backfill estates that already have a valid estateAuthorityType set via the
-- track-selection flow. These can be considered at least MINIMUM_READY.
UPDATE "estates"
SET "completeness_level" = 'MINIMUM_READY'
WHERE "completeness_level" = 'UNSET'
  AND "deceased_state" IS NOT NULL
  AND "deceased_state" <> ''
  AND "user_selected_estate_authority_type" IN ('PROBATE', 'TRUST', 'BOTH');
