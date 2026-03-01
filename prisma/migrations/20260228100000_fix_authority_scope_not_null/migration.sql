-- Migration: Enforce authorityScope NOT NULL on roadmap_tasks
-- This eliminates the null-authority-scope class of cross-authority leakage bugs.
--
-- Strategy (safe, zero-downtime):
--   1. Create AuthorityScope enum type
--   2. Backfill NULLs deterministically before enforcing NOT NULL
--   3. Alter column to be NOT NULL with the enum type
--   4. Add check constraint as belt-and-suspenders validation

-- Step 1: Create the enum type (idempotent)
DO $$ BEGIN
  CREATE TYPE "AuthorityScope" AS ENUM ('PROBATE', 'TRUST', 'BOTH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Backfill NULL authority_scope values deterministically
-- (a) Trust-only taskCodes → TRUST
UPDATE "roadmap_tasks"
SET authority_scope = 'TRUST'
WHERE authority_scope IS NULL
  AND task_code IN (
    'issue_cert_trust',
    'trustee_acceptance',
    'sign_trustee_acceptance',
    'trustee_accounting',
    'close_trust_accounts',
    'complete_trust_administration',
    'distribute_trust_assets',
    'certify_trust_distribution',
    'locate_trust',
    'identify_successor_trustee',
    'prepare_certification_of_trust',
    'notify_trust_beneficiaries',
    'file_trust_tax_return',
    'trust_inventory',
    'trust_asset_transfer',
    'trustee_resignation',
    'successor_trustee_appointment',
    'trust_amendment',
    'trust_restatement',
    'trust_termination'
  );

-- (b) Probate-only taskCodes → PROBATE
UPDATE "roadmap_tasks"
SET authority_scope = 'PROBATE'
WHERE authority_scope IS NULL
  AND task_code IN (
    'file_petition',
    'file_probate_petition',
    'file_administration_petition',
    'obtain_letters_testamentary',
    'receive_letters_testamentary',
    'obtain_letters_of_authority',
    'receive_letters_administration',
    'file_inventory_appraisal',
    'file_final_accounting',
    'publish_notice_to_creditors',
    'notify_creditors',
    'attend_probate_hearing',
    'attend_administration_hearing',
    'handle_bond_waivers',
    'obtain_bond_waiver_order',
    'file_spousal_petition',
    'obtain_spousal_order',
    'file_succession_petition',
    'obtain_succession_order',
    'obtain_citation',
    'serve_citation',
    'petition_for_probate',
    'open_probate_estate',
    'probate_publication',
    'probate_inventory',
    'file_informal_petition',
    'file_formal_petition',
    'close_probate_estate'
  );

-- (c) Shared / general tasks → BOTH
UPDATE "roadmap_tasks"
SET authority_scope = 'BOTH'
WHERE authority_scope IS NULL
  AND task_code IN (
    'general_executor_duties',
    'notify_beneficiaries',
    'maintain_records',
    'locate_will',
    'locate_documents',
    'secure_property',
    'preliminary_asset_scan',
    'pay_taxes',
    'pay_debts',
    'transfer_assets',
    'close_estate'
  );

-- (d) Keyword-based backfill for tasks with trust-related titles (not yet handled)
UPDATE "roadmap_tasks"
SET authority_scope = 'TRUST'
WHERE authority_scope IS NULL
  AND (
    LOWER(title) LIKE '%trust%'
    OR LOWER(description) LIKE '%trust%'
  )
  AND NOT (
    LOWER(title) LIKE '%probate%'
    OR LOWER(description) LIKE '%probate%'
    OR LOWER(title) LIKE '%letters%'
    OR LOWER(title) LIKE '%petition%'
  );

-- (e) Keyword-based backfill for tasks with probate-related titles
UPDATE "roadmap_tasks"
SET authority_scope = 'PROBATE'
WHERE authority_scope IS NULL
  AND (
    LOWER(title) LIKE '%probate%'
    OR LOWER(title) LIKE '%letters testamentary%'
    OR LOWER(title) LIKE '%letters of%'
    OR LOWER(description) LIKE '%probate court%'
  );

-- (f) Remaining unknown tasks → PROBATE (fail-closed)
-- These are logged for manual review via the admin diagnostics endpoint
UPDATE "roadmap_tasks"
SET authority_scope = 'PROBATE'
WHERE authority_scope IS NULL;

-- Step 3: Alter column to use enum type and enforce NOT NULL
ALTER TABLE "roadmap_tasks"
  ALTER COLUMN "authority_scope" TYPE "AuthorityScope"
    USING "authority_scope"::"AuthorityScope",
  ALTER COLUMN "authority_scope" SET NOT NULL,
  ALTER COLUMN "authority_scope" SET DEFAULT 'PROBATE'::"AuthorityScope";

-- Step 4: Add check constraint as belt-and-suspenders (belt over the enum enforcement)
ALTER TABLE "roadmap_tasks"
  DROP CONSTRAINT IF EXISTS "roadmap_tasks_authority_scope_check";

ALTER TABLE "roadmap_tasks"
  ADD CONSTRAINT "roadmap_tasks_authority_scope_check"
    CHECK ("authority_scope" IN ('PROBATE', 'TRUST', 'BOTH'));

-- Step 5: Ensure index exists (idempotent)
CREATE INDEX IF NOT EXISTS "roadmap_tasks_authority_scope_idx"
  ON "roadmap_tasks"("authority_scope");
