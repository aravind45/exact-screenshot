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
    target: '/documents',
    label: 'Upload Affidavit',
    icon: 'Upload',
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
    target: '/probate/petition/wizard',
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
    type: 'modal',
    target: 'none',
    label: 'Upload Required',
    icon: 'Upload'
  },
  'issue_cert_trust': {
    type: 'modal',
    target: 'none',
    label: 'Upload Required',
    icon: 'Upload'
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
  'distribute_assets': {
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
