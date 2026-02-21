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
    target: '/documents',
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
    target: '/documents',
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
    target: '/documents',
    label: 'Upload Notice',
    icon: 'Upload'
  },
  'mail_notice': {
    type: 'navigate',
    target: '/liabilities',
    label: 'Notify Creditors',
    icon: 'Send'
  },
  'attend_hearing': {
    type: 'navigate',
    target: '/roadmap',
    label: 'View Roadmap',
    icon: 'Layout'
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
  'request_bond_waiver': {
    type: 'navigate',
    target: '/probate/bond-waiver',
    label: 'Avoid Bond Cost',
    icon: 'ShieldCheck',
    variant: 'primary'
  },
  'file_bond_waiver': {
    type: 'navigate',
    target: '/probate/bond-waiver',
    label: 'Open Workbook',
    icon: 'Upload'
  },
  'obtain_bond_waiver_order': {
    type: 'navigate',
    target: '/probate/bond-waiver',
    label: 'Open Workbook',
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
    target: '/roadmap',
    label: 'Generate Statement',
    icon: 'FileText',
    variant: 'primary'
  },
  'discharge_executor': {
    type: 'navigate',
    target: '/roadmap',
    label: 'Closing Statement',
    icon: 'CheckCircle'
  }
};
