-- Backfill NULL authority_scope values and enforce NOT NULL + check constraint
-- Phase 1: Backfill known trust-only tasks
UPDATE roadmap_tasks
SET authority_scope = 'TRUST'
WHERE authority_scope IS NULL
  AND (
    "taskCode" LIKE '%cert%trust%'
    OR "taskCode" LIKE '%trust%cert%'
    OR "taskCode" LIKE '%trustee%'
    OR "taskCode" LIKE '%close_trust%'
    OR "taskCode" LIKE '%distribute_trust%'
    OR "taskCode" LIKE '%certify_trust%'
  );

-- Phase 2: Backfill known probate-only tasks
UPDATE roadmap_tasks
SET authority_scope = 'PROBATE'
WHERE authority_scope IS NULL
  AND (
    "taskCode" LIKE '%petition%'
    OR "taskCode" LIKE '%probate%'
    OR "taskCode" LIKE '%letters%'
    OR "taskCode" LIKE '%inventory%'
    OR "taskCode" LIKE '%final_accounting%'
    OR "taskCode" LIKE '%notice%creditor%'
    OR "taskCode" LIKE '%creditor%notice%'
  );

-- Phase 3: Fail-closed default — remaining NULLs become PROBATE
UPDATE roadmap_tasks
SET authority_scope = 'PROBATE'
WHERE authority_scope IS NULL;

-- Phase 4: Enforce NOT NULL constraint
ALTER TABLE roadmap_tasks
  ALTER COLUMN authority_scope SET NOT NULL;

-- Phase 5: Add check constraint for valid values
ALTER TABLE roadmap_tasks
  DROP CONSTRAINT IF EXISTS chk_authority_scope_valid;

ALTER TABLE roadmap_tasks
  ADD CONSTRAINT chk_authority_scope_valid
  CHECK (authority_scope IN ('PROBATE'::"AuthorityScope", 'TRUST'::"AuthorityScope", 'BOTH'::"AuthorityScope"));
