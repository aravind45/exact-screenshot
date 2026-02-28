-- Phase 2A: Backfill TRUST-specific tasks by explicit taskCode allowlist
UPDATE roadmap_tasks
SET authority_scope = 'TRUST'
WHERE authority_scope IS NULL
  AND "taskCode" IN (
    'locate_trust',
    'review_trust',
    'identify_successor_trustee',
    'sign_trustee_acceptance',
    'sign_acceptance',
    'issue_cert_trust',
    'prepare_cert',
    'prepare_certification_of_trust',
    'notarize_cert',
    'inventory_trust_assets',
    'create_inventory',
    'secure_trust_property',
    'handle_trust_copy_requests',
    'identify_minor_trust_beneficiaries',
    'identify_all_beneficiaries',
    'check_out_of_trust_assets',
    'close_trust_accounts',
    'complete_trust_administration',
    'determine_trust_tax_posture',
    'evaluate_trust_solvency',
    'pay_trust_debts',
    'prepare_trust_accounting',
    'trust_creditor_assessment',
    'verify_trust_titling',
    'verify_titles',
    'file_1041',
    'file_irs_form_56',
    'wait_contest_period'
  );

-- Phase 2B: Backfill BOTH tasks (shared across probate and trust)
UPDATE roadmap_tasks
SET authority_scope = 'BOTH'
WHERE authority_scope IS NULL
  AND "taskCode" IN (
    'secure_property',
    'secure_property_2',
    'open_estate_account',
    'pay_taxes',
    'prepare_accounting',
    'distribute_assets',
    'distribute_assets_to_beneficiaries',
    'close_estate',
    'locate_will',
    'locate_docs_no_will',
    'notify_beneficiaries',
    'maintain_records',
    'records',
    'death_cert',
    'death_certificates',
    'death_certs',
    'gather_death_certs',
    'ein',
    'obtain_ein_probate',
    'obtain_ein_trust',
    'cancel_cards',
    'manage_utilities',
    'pay_funeral',
    'pay_funeral_last_illness',
    'funeral',
    'contact_beneficiaries',
    'communicate',
    'identify_beneficiaries',
    'update_beneficiaries',
    'collect_assets',
    'deposit_funds',
    'collect_funds',
    'collect_receivables',
    'tax_returns',
    'file_taxes',
    'taxes',
    'file_final_1040',
    'file_1040',
    'file_form_1041',
    'evaluate_form_706',
    'obtain_tax_clearance',
    'clearances',
    'distribute_funds',
    'distribution_plan',
    'prepare_distribution_schedule',
    'prepare_schedule',
    'calculate_shares',
    'calc_shares',
    'get_receipts',
    'obtain_beneficiary_receipts',
    'receipts',
    'pay_debts',
    'debt_priority_risk',
    'estate_sales',
    'property_docs',
    'dmv_transfer',
    'transfer_accounts',
    'record_deed',
    'appraise_assets',
    'appraise_real_property',
    'dod_valuations',
    'obtain_dod_valuations',
    'get_dod_values',
    'business_valuation',
    'close_account',
    'close_accounts',
    'send_final_accounting',
    'final_accounting',
    'duties',
    'preliminary_asset_scan',
    'preliminary_inventory',
    'list_assets',
    'list_debts',
    'inventory',
    'inventory_assets',
    'send_statutory_notice',
    'certified_copies',
    'get_copies',
    'marriage_cert',
    'send_certified',
    'manage_business_authority',
    'maintain_property',
    'pay_immediate_bills',
    'pay_ongoing_expenses',
    'freeze_accounts',
    'notify_ssa',
    'notify_state_agencies_health',
    'notify_banks',
    'notify_financial_institutions',
    'issue_k1',
    'w9_form',
    'intl_w8_assessment',
    'itin_acquisition_protocol',
    'international_distribution_prep',
    'tax_withholding_review',
    'tax_reporting',
    'reserve_policy',
    'document_compliance',
    'calculate_totals',
    'calculate_available'
  );

-- Phase 2D: Final fail-closed sweep — remaining NULLs default to PROBATE
UPDATE roadmap_tasks
SET authority_scope = 'PROBATE'
WHERE authority_scope IS NULL;

-- Phase 4A: Create AuthorityScope enum type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuthorityScope') THEN
    CREATE TYPE "AuthorityScope" AS ENUM ('PROBATE', 'TRUST', 'BOTH');
  END IF;
END $$;

-- Phase 4B: Set NOT NULL default and constraint
ALTER TABLE roadmap_tasks
  ALTER COLUMN authority_scope SET DEFAULT 'PROBATE';

ALTER TABLE roadmap_tasks
  ALTER COLUMN authority_scope SET NOT NULL;

-- Phase 4C: Add CHECK constraint as belt-and-suspenders guard
ALTER TABLE roadmap_tasks
  DROP CONSTRAINT IF EXISTS chk_authority_scope_valid;

ALTER TABLE roadmap_tasks
  ADD CONSTRAINT chk_authority_scope_valid
  CHECK (authority_scope IN ('PROBATE', 'TRUST', 'BOTH'));
