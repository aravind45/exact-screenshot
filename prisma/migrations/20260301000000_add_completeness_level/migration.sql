-- Add completeness_level column to estates table
-- Possible values: UNSET | MINIMUM_READY | PROFILE_READY
ALTER TABLE "estates"
  ADD COLUMN IF NOT EXISTS "completeness_level" TEXT NOT NULL DEFAULT 'UNSET';

-- Backfill estates that already have a valid estateAuthorityType set via the
-- track-selection flow. These can be considered at least MINIMUM_READY.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'estates'
      AND column_name = 'user_selected_estate_authority_type'
  ) THEN
    UPDATE "estates"
    SET "completeness_level" = 'MINIMUM_READY'
    WHERE "completeness_level" = 'UNSET'
      AND "deceased_state" IS NOT NULL
      AND "deceased_state" <> ''
      AND "user_selected_estate_authority_type" IN ('PROBATE', 'TRUST', 'BOTH');
  ELSE
    -- Backward-compatible fallback for environments without track-selection column.
    UPDATE "estates"
    SET "completeness_level" = 'MINIMUM_READY'
    WHERE "completeness_level" = 'UNSET'
      AND "deceased_state" IS NOT NULL
      AND "deceased_state" <> ''
      AND "estate_authority_type" IN ('PROBATE', 'TRUST', 'BOTH');
  END IF;
END $$;
