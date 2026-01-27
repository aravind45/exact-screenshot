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
  // Phase 0: Immediate Actions
  'secure_property': {
    type: 'modal',
    target: 'property-checklist',
    label: 'Open Checklist',
    icon: 'CheckSquare'
  },
  'notify_ssa': {
    type: 'modal',
    target: 'ssa-notification',
    label: 'Notify SSA',
    icon: 'Send'
  },
  'forward_mail': {
    type: 'external',
    target: 'https://moversguide.usps.com',
    label: 'USPS Form',
    icon: 'ExternalLink'
  },
  'gather_documents': {
    type: 'navigate',
    target: '/documents',
    label: 'View Documents',
    icon: 'FileText'
  },
  'notify_banks': {
    type: 'navigate',
    target: '/assets?action=notify',
    label: 'Notify Institutions',
    icon: 'Building'
  },
  'secure_valuables': {
    type: 'modal',
    target: 'valuables-checklist',
    label: 'Open Checklist',
    icon: 'Shield'
  },
  
  // Phase 1: Court Filing
  'file_de111': {
    type: 'navigate',
    target: '/probate/petition-wizard',
    label: 'Start Petition',
    icon: 'FileText',
    variant: 'primary'
  },
  'publish_notice': {
    type: 'modal',
    target: 'publication-tracker',
    label: 'Track Publication',
    icon: 'Newspaper'
  },
  'attend_hearing': {
    type: 'modal',
    target: 'court-calendar',
    label: 'View Calendar',
    icon: 'Calendar'
  },
  'upload_letters': {
    type: 'modal',
    target: 'upload-letters',
    label: 'Upload Letters',
    icon: 'Upload',
    variant: 'primary'
  },
  'order_certified_copies': {
    type: 'modal',
    target: 'copy-tracker',
    label: 'Track Copies',
    icon: 'Copy'
  },
  
  // Phase 2: Asset Discovery
  'identify_accounts': {
    type: 'navigate',
    target: '/assets?action=add',
    label: 'Add Assets',
    icon: 'Plus'
  },
  'freeze_accounts': {
    type: 'navigate',
    target: '/assets?phase=asset_discovery&filter=needs_freeze',
    label: 'Freeze Accounts',
    icon: 'Lock',
    variant: 'primary'
  },
  'request_dod_values': {
    type: 'navigate',
    target: '/assets?phase=asset_discovery&filter=needs_dod',
    label: 'Get DOD Values',
    icon: 'DollarSign'
  },
  'order_appraisals': {
    type: 'modal',
    target: 'appraisal-tracker',
    label: 'Track Appraisals',
    icon: 'Home'
  },
  'generate_de160': {
    type: 'navigate',
    target: '/probate/inventory-generator',
    label: 'Generate DE-160',
    icon: 'FileText',
    variant: 'primary'
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
    type: 'modal',
    target: 'liquidation-tracker',
    label: 'Track Sales',
    icon: 'Home'
  },
  'sell_vehicles': {
    type: 'modal',
    target: 'liquidation-tracker',
    label: 'Track Sales',
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
    target: '/probate/closing-statement',
    label: 'Generate Statement',
    icon: 'FileText',
    variant: 'primary'
  },
  'discharge_executor': {
    type: 'modal',
    target: 'discharge-petition',
    label: 'File Discharge',
    icon: 'CheckCircle'
  }
};
