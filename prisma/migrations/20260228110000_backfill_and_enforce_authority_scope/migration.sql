-- Backfill NULL authority_scope values and enforce NOT NULL + check constraint
-- Phase 1: Backfill known trust-only tasks
UPDATE roadmap_tasks
SET authority_scope = 'TRUST'
WHERE authority_scope IS NULL
  AND (
    task_code LIKE '%cert%trust%'
    OR task_code LIKE '%trust%cert%'
    OR task_code LIKE '%trustee%'
    OR task_code LIKE '%close_trust%'
    OR task_code LIKE '%distribute_trust%'
    OR task_code LIKE '%certify_trust%'
  );

-- Phase 2: Backfill known probate-only tasks
UPDATE roadmap_tasks
SET authority_scope = 'PROBATE'
WHERE authority_scope IS NULL
  AND (
    task_code LIKE '%petition%'
    OR task_code LIKE '%probate%'
    OR task_code LIKE '%letters%'
    OR task_code LIKE '%inventory%'
    OR task_code LIKE '%final_accounting%'
    OR task_code LIKE '%notice%creditor%'
    OR task_code LIKE '%creditor%notice%'
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
  ADD CONSTRAINT chk_authority_scope_valid
  CHECK (authority_scope IN ('PROBATE', 'TRUST', 'BOTH'));
