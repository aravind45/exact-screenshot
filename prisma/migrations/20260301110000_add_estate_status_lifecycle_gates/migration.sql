-- Estate lifecycle gating support
-- Adds estate_status enum + column with safe idempotent guards.

DO $$
BEGIN
  CREATE TYPE "EstateStatus" AS ENUM ('DRAFT', 'MINIMUM_READY', 'ACTIVE', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "estates"
  ADD COLUMN IF NOT EXISTS "estate_status" "EstateStatus" NOT NULL DEFAULT 'DRAFT';

-- Backfill: if minimum intake already complete, move to MINIMUM_READY.
UPDATE "estates"
SET "estate_status" = 'MINIMUM_READY'
WHERE "estate_status" = 'DRAFT'
  AND "deceased_state" IS NOT NULL
  AND "deceased_state" <> ''
  AND (
    "user_selected_estate_authority_type" IN ('PROBATE', 'TRUST', 'BOTH')
    OR "estate_authority_type" IN ('PROBATE', 'TRUST', 'BOTH')
    OR "completeness_level" IN ('MINIMUM_READY', 'PROFILE_READY')
  );

-- Backfill: if authority has already been granted/appointed, move to ACTIVE.
UPDATE "estates"
SET "estate_status" = 'ACTIVE'
WHERE "estate_status" IN ('DRAFT', 'MINIMUM_READY')
  AND (
    UPPER(COALESCE("authority_status", '')) IN ('GRANTED', 'LETTERS_ISSUED')
    OR UPPER(COALESCE("probate_status", '')) = 'EXECUTOR_APPOINTED'
  );
