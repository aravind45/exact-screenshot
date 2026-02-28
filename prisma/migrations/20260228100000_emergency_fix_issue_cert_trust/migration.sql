-- Emergency Fix: Set authority_scope='TRUST' for all issue_cert_trust rows
-- Root cause: task was incorrectly set to authority_scope=NULL (or BOTH) causing
-- "Issue Certificate of Trust" to appear in PROBATE roadmaps.

UPDATE roadmap_tasks
SET authority_scope = 'TRUST'
WHERE task_code = 'issue_cert_trust';
