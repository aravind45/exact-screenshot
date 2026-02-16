import type { HelpContent } from '@/types/navigation';

/**
 * Centralized help content database keyed by page/section id.
 * Each entry provides contextual help for a specific area of the app.
 */
export const HELP_CONTENT: Record<string, HelpContent> = {
  dashboard: {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description:
      'Your dashboard is the central hub for managing the estate. It shows your current progress, upcoming tasks, and any items that need attention.',
    tips: [
      'Check the dashboard daily for new notifications and follow-ups.',
      'Use the progress bar to see how far along you are in the settlement process.',
      'Click on any card to jump directly to that section.',
    ],
    faq: [
      {
        question: 'What should I do first?',
        answer:
          'Start by completing your Estate Profile in the Setup phase. This includes adding the deceased person\'s information and uploading the death certificate.',
      },
      {
        question: 'How is progress calculated?',
        answer:
          'Progress is based on completed tasks across all four phases: Setup, Discovery, Settlement, and Close.',
      },
    ],
    relatedLinks: [
      { label: 'Estate Profile', path: '/estate-profile' },
      { label: 'Asset Inventory', path: '/assets' },
    ],
  },

  'estate-profile': {
    id: 'estate-profile',
    title: 'Estate Profile',
    description:
      'The Estate Profile contains all the essential information about the deceased and the executor. Completing this section is the first step in the settlement process.',
    tips: [
      'Have the death certificate ready before starting.',
      'Double-check the jurisdiction — it affects probate requirements.',
      'You can update this information at any time.',
    ],
    faq: [
      {
        question: 'Why do I need to upload a death certificate?',
        answer:
          'Financial institutions require a certified copy of the death certificate before releasing any information or assets.',
      },
      {
        question: 'What if I don\'t know all the details yet?',
        answer:
          'Fill in what you can now and come back later. Partial profiles are saved automatically.',
      },
    ],
    relatedLinks: [
      { label: 'Probate Hub', path: '/probate' },
      { label: 'Dashboard', path: '/dashboard' },
    ],
  },

  'probate-hub': {
    id: 'probate-hub',
    title: 'Probate Hub',
    description:
      'The Probate Hub helps you understand and manage the legal process of probate. Track court filings, deadlines, and required documents all in one place.',
    tips: [
      'Determine early whether full probate or small estate affidavit applies.',
      'Keep track of all court filing deadlines here.',
      'Consult an attorney if you are unsure about probate requirements.',
    ],
    faq: [
      {
        question: 'Do I need probate?',
        answer:
          'It depends on the estate value and your state\'s laws. Small estates may qualify for a simplified process.',
      },
      {
        question: 'How long does probate take?',
        answer:
          'Probate typically takes 6 to 12 months, but it varies by state and estate complexity.',
      },
    ],
    relatedLinks: [
      { label: 'Estate Profile', path: '/estate-profile' },
      { label: 'Document Vault', path: '/documents' },
    ],
  },

  'asset-inventory': {
    id: 'asset-inventory',
    title: 'Asset Inventory',
    description:
      'The Asset Inventory is where you track every asset belonging to the estate. Add bank accounts, real estate, investments, and personal property.',
    tips: [
      'Start with assets you already know about, then use Document Scanner to find more.',
      'Include estimated values — they can be updated later.',
      'Group similar assets together for easier management.',
    ],
    faq: [
      {
        question: 'What counts as an asset?',
        answer:
          'Anything of value: bank accounts, investments, real estate, vehicles, insurance policies, retirement accounts, and personal property.',
      },
      {
        question: 'How do I find assets I don\'t know about?',
        answer:
          'Upload financial documents to the Document Scanner. It will automatically detect and suggest potential assets.',
      },
    ],
    relatedLinks: [
      { label: 'Document Scanner', path: '/upload' },
      { label: 'Asset Detective', path: '/asset-detective' },
    ],
  },

  'document-scanner': {
    id: 'document-scanner',
    title: 'Document Scanner',
    description:
      'Upload financial documents and let our AI-powered scanner extract asset information automatically. It identifies accounts, institutions, and values from statements and letters.',
    tips: [
      'Upload bank statements, tax returns, and insurance documents for best results.',
      'Higher quality scans produce more accurate results.',
      'Review extracted information before adding it to your inventory.',
    ],
    faq: [
      {
        question: 'What types of documents can I upload?',
        answer:
          'PDF, JPG, and PNG files are supported. Bank statements, tax returns, insurance policies, and investment statements work best.',
      },
      {
        question: 'Is my data secure?',
        answer:
          'Yes. All documents are encrypted in transit and at rest. Only you and authorized users can access them.',
      },
    ],
    relatedLinks: [
      { label: 'Asset Inventory', path: '/assets' },
      { label: 'Document Vault', path: '/documents' },
    ],
  },

  'asset-detective': {
    id: 'asset-detective',
    title: 'Asset Detective',
    description:
      'Asset Detective analyzes your uploaded documents to find assets you might have missed. It cross-references information to uncover hidden accounts and holdings.',
    tips: [
      'Upload as many documents as possible for better detection.',
      'Check the suggestions regularly — new matches appear as you add documents.',
      'Confirm or dismiss each suggestion to keep your inventory accurate.',
    ],
    faq: [
      {
        question: 'How does Asset Detective find hidden assets?',
        answer:
          'It analyzes document content for references to financial institutions, account numbers, and asset types that aren\'t yet in your inventory.',
      },
    ],
    relatedLinks: [
      { label: 'Document Scanner', path: '/upload' },
      { label: 'Asset Inventory', path: '/assets' },
    ],
  },

  'active-assets': {
    id: 'active-assets',
    title: 'Active Assets',
    description:
      'Track assets that are currently being processed. Monitor the status of each claim, see what\'s pending, and know what needs your attention next.',
    tips: [
      'Focus on assets with the oldest "last contact" date first.',
      'Log every communication — it helps track progress and follow-ups.',
      'Check for status updates from institutions regularly.',
    ],
    faq: [
      {
        question: 'What does each status mean?',
        answer:
          'Pending: waiting for institution response. In Progress: actively being processed. Approved: ready for distribution. Distributed: fully settled.',
      },
    ],
    relatedLinks: [
      { label: 'Communications', path: '/communications' },
      { label: 'Follow-ups', path: '/follow-ups' },
    ],
  },

  communications: {
    id: 'communications',
    title: 'Communications Log',
    description:
      'Keep a record of every interaction with financial institutions, attorneys, and other parties. This log serves as your paper trail throughout the settlement.',
    tips: [
      'Log calls immediately after they happen so you don\'t forget details.',
      'Include the name of the person you spoke with and any reference numbers.',
      'Attach relevant documents to each communication entry.',
    ],
    faq: [
      {
        question: 'Why should I log communications?',
        answer:
          'A detailed communication log protects you legally and helps you track what each institution requires and when to follow up.',
      },
    ],
    relatedLinks: [
      { label: 'Active Assets', path: '/settlement/assets' },
      { label: 'Follow-ups', path: '/follow-ups' },
    ],
  },

  'document-vault': {
    id: 'document-vault',
    title: 'Document Vault',
    description:
      'Your secure, centralized storage for all estate-related documents. Organize death certificates, court orders, financial statements, and correspondence.',
    tips: [
      'Upload documents as soon as you receive them.',
      'Use descriptive names so documents are easy to find later.',
      'Keep originals in a safe place — these are digital copies.',
    ],
    faq: [
      {
        question: 'Can I share documents with my attorney?',
        answer:
          'Yes. You can grant access to specific documents or folders for authorized collaborators.',
      },
    ],
    relatedLinks: [
      { label: 'Document Scanner', path: '/upload' },
      { label: 'Estate Profile', path: '/estate-profile' },
    ],
  },

  'follow-ups': {
    id: 'follow-ups',
    title: 'Follow-ups',
    description:
      'Never miss a deadline or forget to call back. Follow-ups tracks all your pending actions, reminders, and institution response timelines.',
    tips: [
      'Set follow-up reminders when you log a communication.',
      'Prioritize items marked as urgent — they may have deadlines.',
      'Mark items as complete once resolved to keep your list clean.',
    ],
    faq: [
      {
        question: 'How do follow-ups get created?',
        answer:
          'They\'re automatically generated when you log a communication, or you can create them manually for any task.',
      },
    ],
    relatedLinks: [
      { label: 'Communications', path: '/communications' },
      { label: 'Active Assets', path: '/settlement/assets' },
    ],
  },

  'final-distribution': {
    id: 'final-distribution',
    title: 'Final Distribution',
    description:
      'Track the distribution of assets to beneficiaries. Record who receives what, when distributions are made, and maintain a complete audit trail.',
    tips: [
      'Ensure all debts and taxes are paid before distributing assets.',
      'Get receipts or acknowledgments from beneficiaries.',
      'Consult your attorney before making final distributions.',
    ],
    faq: [
      {
        question: 'When can I start distributing assets?',
        answer:
          'Generally after all debts are paid, taxes filed, and the probate court approves distribution. Your attorney can advise on timing.',
      },
    ],
    relatedLinks: [
      { label: 'Tax Documents', path: '/tax-documents' },
      { label: 'Close Estate', path: '/close-estate' },
    ],
  },

  'tax-documents': {
    id: 'tax-documents',
    title: 'Tax Documents',
    description:
      'Manage estate tax returns and related filings. Track deadlines, gather required forms, and ensure compliance with federal and state tax requirements.',
    tips: [
      'Estate tax returns are typically due 9 months after the date of death.',
      'Consider hiring a tax professional for complex estates.',
      'Keep copies of all filed returns in the Document Vault.',
    ],
    faq: [
      {
        question: 'Does every estate need to file taxes?',
        answer:
          'A final income tax return is usually required. Estate tax returns are only needed if the estate exceeds the federal or state exemption threshold.',
      },
    ],
    relatedLinks: [
      { label: 'Final Distribution', path: '/final-distribution' },
      { label: 'Document Vault', path: '/documents' },
    ],
  },

  'close-estate': {
    id: 'close-estate',
    title: 'Close Estate',
    description:
      'The final step. Complete the closing checklist, file final documents with the court, and officially close the estate.',
    tips: [
      'Review the closing checklist carefully — missing items can delay closure.',
      'File the final accounting with the probate court.',
      'Notify all institutions that the estate is closed.',
    ],
    faq: [
      {
        question: 'How do I know when the estate is ready to close?',
        answer:
          'All assets must be distributed, all debts paid, all tax returns filed, and the court must approve the final accounting.',
      },
    ],
    relatedLinks: [
      { label: 'Final Distribution', path: '/final-distribution' },
      { label: 'Dashboard', path: '/dashboard' },
    ],
  },
};

/**
 * Look up help content by page/section id.
 * Returns undefined if no content exists for the given id.
 */
export function getHelpContent(contextId: string): HelpContent | undefined {
  return HELP_CONTENT[contextId];
}

/**
 * Get all available help content ids.
 */
export function getHelpContentIds(): string[] {
  return Object.keys(HELP_CONTENT);
}
