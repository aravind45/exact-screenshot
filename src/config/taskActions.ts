/**
 * Task Action Configuration
 * 
 * Maps roadmap task IDs to actionable buttons that navigate to
 * the appropriate page or open a modal.
 */

export interface TaskAction {
  type: 'navigate' | 'modal' | 'external';
  target: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

export const TASK_ACTIONS: Record<string, TaskAction> = {
  // Phase 0: Preliminary Assessment
  'check_small_estate': {
    type: 'navigate',
    target: '/probate/small-estate',
    label: 'Start Fast-Track',
    icon: 'Zap',
    variant: 'primary'
  },
  'confirm_executor_role': {
    type: 'navigate',
    target: '/profile',
    label: 'Profile Settings',
    icon: 'Settings'
  },
  // Phase 1: Immediate Actions
  'secure_property': {
    type: 'navigate',
    target: '/documents',
    label: 'Upload Photos',
    icon: 'Upload'
  },
  'notify_ssa': {
    type: 'navigate',
    target: 'none', // Handled by integrated requiredDocs
    label: 'Upload Death Certificate',
    icon: 'Upload',
    variant: 'primary'
  },
  'cancel_cards': {
    type: 'navigate',
    target: '/assets',
    label: 'Manage Accounts',
    icon: 'CreditCard'
  },
  'locate_will': {
    type: 'navigate',
    target: '/documents',
    label: 'Upload Will',
    icon: 'Upload'
  },
  'locate_docs_no_will': {
    type: 'navigate',
    target: '/documents',
    label: 'Upload Documents',
    icon: 'Upload'
  },
  'open_estate_account': {
    type: 'navigate',
    target: 'none', // Handled by integrated requiredDocs: Death Cert, Letters, EIN
    label: 'Upload Proof',
    icon: 'Upload'
  },
  'pay_immediate_bills': {
    type: 'navigate',
    target: '/assets',
    label: 'Track Bills',
    icon: 'DollarSign'
  },

  // Phase 1: Court Filing
  'file_petition': {
    type: 'navigate',
    target: '/probate/petition',
    label: 'Start Petition',
    icon: 'FileText',
    variant: 'primary'
  },
  'publish_notice': {
    type: 'navigate',
    target: 'none', // Handled by integrated requiredDocs
    label: 'Upload Notice',
    icon: 'Upload'
  },
  'mail_notice': {
    type: 'navigate',
    target: 'none', // Handled by integrated requiredDocs
    label: 'Notify Creditors',
    icon: 'Send'
  },
  'attend_hearing': {
    type: 'navigate',
    target: 'none', // Handled by integrated requiredDocs
    label: 'Gather Hearing Docs',
    icon: 'FileText',
    variant: 'primary'
  },
  // These are now handled by integrated UI in CollapsiblePhaseChevron
  'receive_letters': {
    type: 'modal',
    target: 'none',
    label: 'Upload Required',
    icon: 'Upload'
  },
  'file_affidavit': {
    type: 'modal',
    target: 'none',
    label: 'Upload Required',
    icon: 'Upload'
  },
  'file_spousal_petition': {
    type: 'navigate',
    target: '/probate/spousal-petition',
    label: 'Start Spousal Path',
    icon: 'Heart',
    variant: 'primary'
  },
  'file_succession_petition': {
    type: 'navigate',
    target: '/probate/succession-petition',
    label: 'Start Succession',
    icon: 'Home',
    variant: 'primary'
  },
  'check_primary_residence_succession': {
    type: 'navigate',
    target: '/probate/succession-petition',
    label: 'Check Eligibility',
    icon: 'Search'
  },
  'issue_cert_trust': {
    type: 'modal',
    target: 'none',
    label: 'Upload Required',
    icon: 'Upload'
  },
  'identify_minor_beneficiaries': {
    type: 'navigate',
    target: '/probate/guardian-ad-litem',
    label: 'Protect Minors',
    icon: 'Baby',
    variant: 'primary'
  },
  'petition_guardian_ad_litem': {
    type: 'navigate',
    target: '/probate/guardian-ad-litem',
    label: 'Set Up Guardian',
    icon: 'ShieldCheck',
    variant: 'primary'
  },
  'obtain_guardian_order': {
    type: 'navigate',
    target: '/probate/guardian-ad-litem',
    label: 'Get Final Order',
    icon: 'Gavel',
    variant: 'primary'
  },
  'coordinate_with_guardian': {
    type: 'navigate',
    target: '/probate/guardian-ad-litem',
    label: 'Open Workbook',
    icon: 'Users'
  },
  'handle_bond_waivers': {
    type: 'navigate',
    target: '/probate/bond-waiver',
    label: 'Avoid Bond Cost',
    icon: 'ShieldCheck',
    variant: 'primary'
  },
  'obtain_bond_waiver_order': {
    type: 'navigate',
    target: 'none', // Handled by integrated requiredDocs: DE-143, DE-140
    label: 'Get Final Order',
    icon: 'Gavel'
  },
  'track_special_notice_requests': {
    type: 'navigate',
    target: '/probate/special-notice',
    label: 'Open Registry',
    icon: 'Bell',
    variant: 'primary'
  },
  'serve_special_notice_parties': {
    type: 'navigate',
    target: '/probate/special-notice',
    label: 'Service Tracker',
    icon: 'Mail'
  },
  'respond_to_objections': {
    type: 'navigate',
    target: '/probate/contested-probate',
    label: 'View Litigation',
    icon: 'Gavel',
    variant: 'primary'
  },
  'attend_contest_hearing': {
    type: 'navigate',
    target: '/probate/contested-probate',
    label: 'Hearing Plan',
    icon: 'Users'
  },
  'resolve_contest': {
    type: 'navigate',
    target: '/probate/contested-probate',
    label: 'View Outcome',
    icon: 'Scale'
  },
  'prepare_notice_proposed_action': {
    type: 'navigate',
    target: '/probate/asset-sale',
    label: 'Authorization',
    icon: 'ShoppingCart',
    variant: 'primary'
  },
  'wait_proposed_action_period': {
    type: 'navigate',
    target: '/probate/asset-sale',
    label: 'Track Notice',
    icon: 'Clock'
  },
  'petition_confirm_sale': {
    type: 'navigate',
    target: '/probate/asset-sale',
    label: 'File Petition',
    icon: 'FileText'
  },
  'obtain_sale_confirmation_order': {
    type: 'navigate',
    target: '/probate/asset-sale',
    label: 'Obtain Order',
    icon: 'Download'
  },
  'sell_property': {
    type: 'navigate',
    target: '/probate/asset-sale',
    label: 'Finalize Sale',
    icon: 'Building2'
  },
  'prepare_accounting': {
    type: 'navigate',
    target: '/probate/final-distribution',
    label: 'Finalize Estate',
    icon: 'Calculator',
    variant: 'primary'
  },
  'file_final_petition': {
    type: 'navigate',
    target: '/probate/final-distribution',
    label: 'File Petition',
    icon: 'FileText'
  },
  'distribute_assets': {
    type: 'navigate',
    target: '/probate/final-distribution',
    label: 'Track Shares',
    icon: 'Banknote'
  },
  'close_estate': {
    type: 'navigate',
    target: '/probate/final-distribution',
    label: 'Get Discharge',
    icon: 'Lock'
  },

  // Phase 2: Asset Discovery
  'freeze_accounts': {
    type: 'navigate',
    target: '/assets?phase=asset_discovery&filter=needs_freeze',
    label: 'Freeze Accounts',
    icon: 'Lock',
    variant: 'primary'
  },
  'get_dod_values': {
    type: 'navigate',
    target: '/assets?phase=asset_discovery&filter=needs_dod',
    label: 'Get DOD Values',
    icon: 'DollarSign'
  },
  'hire_appraiser': {
    type: 'navigate',
    target: '/assets',
    label: 'Manage Assets',
    icon: 'Home'
  },
  'complete_inventory': {
    type: 'modal',
    target: 'none',
    label: 'Upload Required',
    icon: 'Upload'
  },
  'file_inventory': {
    type: 'modal',
    target: 'none',
    label: 'Upload Required',
    icon: 'Upload'
  },

  // Phase 3: Creditor Claims
  'publish_creditor_notice': {
    type: 'modal',
    target: 'publication-tracker',
    label: 'Track Publication',
    icon: 'Newspaper'
  },
  'review_claims': {
    type: 'navigate',
    target: '/liabilities?filter=pending',
    label: 'Review Claims',
    icon: 'AlertCircle'
  },
  'pay_priority_debts': {
    type: 'navigate',
    target: '/liabilities?filter=priority',
    label: 'Pay Debts',
    icon: 'CreditCard',
    variant: 'primary'
  },
  'reject_invalid_claims': {
    type: 'navigate',
    target: '/liabilities?action=reject',
    label: 'Reject Claims',
    icon: 'XCircle'
  },
  'file_accounting': {
    type: 'navigate',
    target: '/accounting',
    label: 'View Accounting',
    icon: 'BarChart'
  },

  // Phase 4: Liquidation
  'list_real_estate': {
    type: 'navigate',
    target: '/assets',
    label: 'Manage Assets',
    icon: 'Home'
  },
  'sell_vehicles': {
    type: 'navigate',
    target: '/assets',
    label: 'Manage Assets',
    icon: 'Car'
  },
  'file_tax_returns': {
    type: 'navigate',
    target: '/tax-management',
    label: 'File Taxes',
    icon: 'FileText'
  },
  'generate_accounting': {
    type: 'navigate',
    target: '/accounting',
    label: 'Generate Report',
    icon: 'BarChart',
    variant: 'primary'
  },
  'close_accounts': {
    type: 'navigate',
    target: '/assets?filter=ready_to_close',
    label: 'Close Accounts',
    icon: 'XCircle'
  },

  // Phase 5: Final Distribution
  'file_distribution_petition': {
    type: 'navigate',
    target: '/probate/distribution-petition',
    label: 'File Petition',
    icon: 'FileText',
    variant: 'primary'
  },
  'distribute_assets_legacy': {
    type: 'navigate',
    target: '/distribution',
    label: 'Track Distribution',
    icon: 'Send'
  },
  'collect_receipts': {
    type: 'navigate',
    target: '/receipts',
    label: 'Track Receipts',
    icon: 'CheckCircle'
  },
  'file_closing_statement': {
    type: 'navigate',
    target: '/accounting',
    label: 'Generate Statement',
    icon: 'FileText',
    variant: 'primary'
  },
  'discharge_executor': {
    type: 'navigate',
    target: '/distribution',
    label: 'Track Distribution',
    icon: 'CheckCircle'
  },

  // Cross-state fallback actions (confidence hardening)
  'distribute': {
    type: 'navigate',
    target: '/distribution',
    label: 'Track Distribution',
    icon: 'Send'
  },
  'pay_debts': {
    type: 'navigate',
    target: '/liabilities?filter=priority',
    label: 'Pay Debts',
    icon: 'CreditCard',
    variant: 'primary'
  },
  'apply_priority': {
    type: 'navigate',
    target: '/liabilities?filter=priority',
    label: 'Apply Priority',
    icon: 'ListOrdered'
  },
  'appraisal': {
    type: 'navigate',
    target: '/assets?filter=needs_appraisal',
    label: 'Start Appraisal',
    icon: 'ClipboardList'
  },
  'attend_final_hearing': {
    type: 'navigate',
    target: '/roadmap',
    label: 'Prepare Hearing',
    icon: 'Gavel'
  },
  'blocked_account_minors': {
    type: 'navigate',
    target: '/probate/guardian-ad-litem',
    label: 'Protect Minors',
    icon: 'ShieldCheck'
  },
  'bond': {
    type: 'navigate',
    target: '/probate/bond-waiver',
    label: 'Bond Setup',
    icon: 'Shield'
  },
  'business_valuation': {
    type: 'navigate',
    target: '/assets',
    label: 'Value Business',
    icon: 'Building2'
  },
  'calculate_filing_fees': {
    type: 'navigate',
    target: '/probate/petition',
    label: 'Review Filing Fees',
    icon: 'Calculator'
  },
  'categorize_claims': {
    type: 'navigate',
    target: '/liabilities?filter=pending',
    label: 'Categorize Claims',
    icon: 'Filter'
  },
  'compile_required_form_pack': {
    type: 'navigate',
    target: '/forms',
    label: 'Open Form Pack',
    icon: 'FileStack'
  },
  'compile_will_and_proof': {
    type: 'navigate',
    target: '/documents',
    label: 'Upload Will Proof',
    icon: 'Upload'
  },
  'confirm_us_rep': {
    type: 'navigate',
    target: '/profile',
    label: 'Confirm Representative',
    icon: 'UserCheck'
  },
  'court_order': {
    type: 'navigate',
    target: '/documents',
    label: 'Upload Court Order',
    icon: 'Scale'
  },
  'determine_bond': {
    type: 'navigate',
    target: '/probate/bond-waiver',
    label: 'Determine Bond',
    icon: 'ShieldCheck'
  },
  'discharge': {
    type: 'navigate',
    target: '/probate/final-distribution',
    label: 'Request Discharge',
    icon: 'CheckCircle'
  },
  'ein': {
    type: 'navigate',
    target: '/documents',
    label: 'Store EIN Docs',
    icon: 'FileText'
  },
  'estimate_value': {
    type: 'navigate',
    target: '/assets',
    label: 'Estimate Value',
    icon: 'DollarSign'
  },
  'evaluate_solvency': {
    type: 'navigate',
    target: '/liabilities',
    label: 'Evaluate Solvency',
    icon: 'AlertTriangle'
  },
  'file_final_accounting': {
    type: 'navigate',
    target: '/accounting',
    label: 'File Accounting',
    icon: 'BarChart'
  },
  'final_petition': {
    type: 'navigate',
    target: '/probate/final-distribution',
    label: 'File Final Petition',
    icon: 'FileText'
  },
  'gather_death_certs': {
    type: 'navigate',
    target: '/documents',
    label: 'Upload Certificates',
    icon: 'Upload'
  },
  'genealogical_search': {
    type: 'navigate',
    target: '/heirs',
    label: 'Review Heirs',
    icon: 'Users'
  },
  'identify_jurisdiction': {
    type: 'navigate',
    target: '/profile',
    label: 'Set Jurisdiction',
    icon: 'MapPin'
  },
  'international_distribution_prep': {
    type: 'navigate',
    target: '/distribution',
    label: 'International Prep',
    icon: 'Globe'
  },
  'inventory_assets': {
    type: 'navigate',
    target: '/assets',
    label: 'Inventory Assets',
    icon: 'Package'
  },
  'issue_k1': {
    type: 'navigate',
    target: '/tax-management',
    label: 'Issue K-1',
    icon: 'Receipt'
  },
  'letters': {
    type: 'navigate',
    target: '/probate/letters',
    label: 'Prepare Letters',
    icon: 'Mail'
  },
  'lodge_will': {
    type: 'navigate',
    target: '/documents',
    label: 'Lodge Will',
    icon: 'Upload'
  },
  'manage_business_authority': {
    type: 'navigate',
    target: '/assets',
    label: 'Manage Authority',
    icon: 'Building2'
  },
  'manage_utilities': {
    type: 'navigate',
    target: '/assets',
    label: 'Track Utilities',
    icon: 'Wrench'
  },
  'minor_beneficiary_court_approval': {
    type: 'navigate',
    target: '/probate/guardian-ad-litem',
    label: 'Minor Approval',
    icon: 'ShieldCheck'
  },
  'notify_banks': {
    type: 'navigate',
    target: '/assets',
    label: 'Notify Banks',
    icon: 'Landmark'
  },
  'notify_creditors': {
    type: 'navigate',
    target: '/liabilities',
    label: 'Notify Creditors',
    icon: 'Bell'
  },
  'pay_approved': {
    type: 'navigate',
    target: '/liabilities?filter=approved',
    label: 'Pay Approved Claims',
    icon: 'CheckCircle'
  },
  'preliminary_inventory': {
    type: 'navigate',
    target: '/assets',
    label: 'Preliminary Inventory',
    icon: 'ClipboardList'
  },
  'request_temporary_authority': {
    type: 'navigate',
    target: '/probate/petition',
    label: 'Temporary Authority',
    icon: 'FileText'
  },
  'screen_fiduciary_eligibility': {
    type: 'navigate',
    target: '/profile',
    label: 'Verify Eligibility',
    icon: 'UserCheck'
  },
  'secure_property_2': {
    type: 'navigate',
    target: '/assets',
    label: 'Secure Property',
    icon: 'Shield'
  },
  'tax_returns': {
    type: 'navigate',
    target: '/tax-management',
    label: 'File Tax Returns',
    icon: 'FileText'
  },
  'tax_withholding_review': {
    type: 'navigate',
    target: '/tax-management',
    label: 'Review Withholding',
    icon: 'Calculator'
  },
  'transfer_accounts': {
    type: 'navigate',
    target: '/distribution',
    label: 'Transfer Accounts',
    icon: 'RefreshCcw'
  },
  'validate_venue_jurisdiction': {
    type: 'navigate',
    target: '/probate/petition',
    label: 'Validate Venue',
    icon: 'MapPin'
  },
  'prepare_required_notices_and_waivers': {
    type: 'navigate',
    target: '/probate/special-notice',
    label: 'Prepare Notices',
    icon: 'FileText'
  },
  'validate_interested_parties': {
    type: 'navigate',
    target: '/heirs',
    label: 'Validate Parties',
    icon: 'Users'
  },
  'wait_claim_period': {
    type: 'navigate',
    target: '/liabilities',
    label: 'Track Claim Window',
    icon: 'Clock'
  },
  'attach_will': {
    type: 'navigate',
    target: '/documents',
    label: 'Attach Will',
    icon: 'Paperclip'
  },
  'beneficiary_consents': {
    type: 'navigate',
    target: '/heirs',
    label: 'Collect Consents',
    icon: 'Users'
  },
  'brief_hearing': {
    type: 'navigate',
    target: '/roadmap',
    label: 'Prepare Hearing Brief',
    icon: 'Gavel'
  },
  'certified_copies': {
    type: 'navigate',
    target: '/documents',
    label: 'Upload Certified Copies',
    icon: 'Copy'
  },
  'closing_statement': {
    type: 'navigate',
    target: '/accounting',
    label: 'Closing Statement',
    icon: 'FileText'
  },
  'collect_assets': {
    type: 'navigate',
    target: '/assets',
    label: 'Collect Assets',
    icon: 'Package'
  },
  'communicate': {
    type: 'navigate',
    target: '/inbox',
    label: 'Send Updates',
    icon: 'MessageSquare'
  },
  'contact_beneficiaries': {
    type: 'navigate',
    target: '/heirs',
    label: 'Contact Beneficiaries',
    icon: 'Users'
  },
  'distribution_plan': {
    type: 'navigate',
    target: '/distribution',
    label: 'Distribution Plan',
    icon: 'Workflow'
  },
  'document_agreement': {
    type: 'navigate',
    target: '/documents',
    label: 'Document Agreement',
    icon: 'FileText'
  },
  'expedited_hearing': {
    type: 'navigate',
    target: '/probate/petition',
    label: 'Expedite Hearing',
    icon: 'Gavel'
  },
  'file_court': {
    type: 'navigate',
    target: '/probate/petition',
    label: 'File with Court',
    icon: 'Scale'
  },
  'file_taxes': {
    type: 'navigate',
    target: '/tax-management',
    label: 'File Taxes',
    icon: 'Receipt'
  },
  'minimal_supervision': {
    type: 'navigate',
    target: '/roadmap',
    label: 'Review Track',
    icon: 'Compass'
  },
  'no_accounting': {
    type: 'navigate',
    target: '/accounting',
    label: 'Accounting Check',
    icon: 'BarChart'
  },
  'no_contests': {
    type: 'navigate',
    target: '/probate/contested-probate',
    label: 'Contest Check',
    icon: 'ShieldAlert'
  },
  'no_inventory': {
    type: 'navigate',
    target: '/assets',
    label: 'Inventory Check',
    icon: 'ClipboardList'
  },
  'notify_heirs': {
    type: 'navigate',
    target: '/heirs',
    label: 'Notify Heirs',
    icon: 'Bell'
  },
  'prepare_petition': {
    type: 'navigate',
    target: '/probate/petition',
    label: 'Prepare Petition',
    icon: 'FileText'
  },
  'receipts': {
    type: 'navigate',
    target: '/receipts',
    label: 'Collect Receipts',
    icon: 'CheckCircle'
  },
  'records': {
    type: 'navigate',
    target: '/documents',
    label: 'Keep Records',
    icon: 'Archive'
  },
  'reduced_fees': {
    type: 'navigate',
    target: '/probate/small-estate',
    label: 'Fee Reduction Path',
    icon: 'BadgeDollarSign'
  },
  'review_will': {
    type: 'navigate',
    target: '/documents',
    label: 'Review Will',
    icon: 'Search'
  },
  'state_requirements': {
    type: 'navigate',
    target: '/roadmap',
    label: 'Review Requirements',
    icon: 'Map'
  },
  'verify_no_disputes': {
    type: 'navigate',
    target: '/probate/contested-probate',
    label: 'Verify No Disputes',
    icon: 'ShieldCheck'
  },
  'waive_bond': {
    type: 'navigate',
    target: '/probate/bond-waiver',
    label: 'Waive Bond',
    icon: 'Shield'
  }
};




