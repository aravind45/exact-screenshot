-- Fix: Set authorityScope = 'TRUST' for issue_cert_trust task
-- Root cause: issue_cert_trust had authorityScope = NULL, causing it to leak
-- into PROBATE roadmaps. Certificate of Trust is a trust-only instrument.

UPDATE "roadmap_tasks"
SET "authority_scope" = 'TRUST'
WHERE "taskCode" = 'issue_cert_trust'
  AND ("authority_scope" IS NULL OR "authority_scope" != 'TRUST');
