import { WorkflowConfig } from './bank';

export const trustAdminWorkflow: WorkflowConfig = {
    institution: "{{trustName}}",
    category: "trust_administration",
    steps: [
        {
            id: 'trustee_acceptance',
            title: 'Phase 1: Trustee Acceptance & Certification',
            description: 'Accept your role as Successor Trustee and prepare the Certificate of Trust to prove your authority.',
            guidance: 'Review the trust document carefully. As trustee, you have a fiduciary duty to follow the trust terms exactly and act in the best interests of beneficiaries.',
            requiredDocs: [
                'Original Trust Document',
                'Death Certificate',
                'Trustee Acceptance form',
                'Certificate of Trust (to be prepared)'
            ],
            alerts: [
                {
                    type: "important",
                    message: "Fiduciary Duty: As trustee, you are legally required to act in the best interests of the beneficiaries. Keep detailed records of all decisions and transactions."
                }
            ],
            requiresNotary: true,
            estimatedTime: '3-5 days'
        },
        {
            id: 'beneficiary_notification',
            title: 'Phase 2: Beneficiary Notification (120-Day Notice)',
            description: 'Notify all beneficiaries of the trust administration and their right to request a copy of the trust.',
            guidance: 'California Probate Code Section 16061.7 requires you to notify beneficiaries within 60 days of accepting the trustee role. This starts a 120-day period for beneficiaries to contest.',
            requiredDocs: [
                'Beneficiary list from trust',
                'Notice letters (one per beneficiary)',
                'Certified mail receipts',
                'Copy of trust (if requested)'
            ],
            alerts: [
                {
                    type: "warning",
                    message: "Legal Requirement: You MUST send this notice via certified mail. Keep all receipts as proof of compliance. Failure to provide proper notice can result in personal liability."
                },
                {
                    type: "info",
                    message: "120-Day Wait: You should wait 120 days after sending notices before making final distributions. This gives beneficiaries time to raise any concerns."
                }
            ],
            requiresPhysicalMail: true,
            estimatedTime: '1-2 weeks to send, 120 days to wait'
        },
        {
            id: 'asset_inventory',
            title: 'Phase 3: Trust Asset Inventory',
            description: 'Identify and value all assets titled in the name of the trust.',
            guidance: 'Only assets specifically titled in the trust name are part of the trust estate. Assets in the decedent individual name may require probate.',
            requiredDocs: [
                'Trust Asset Inventory (internal document)',
                'Date-of-Death valuations for each asset',
                'Bank/brokerage statements',
                'Real estate appraisals',
                'Personal property valuations'
            ],
            alerts: [
                {
                    type: "caution",
                    message: "Trust vs. Probate Assets: Verify each asset is actually titled in the trust name. If assets were never transferred to the trust, they may require probate."
                }
            ],
            estimatedTime: '2-4 weeks'
        },
        {
            id: 'expenses_taxes',
            title: 'Phase 4: Pay Expenses & File Taxes',
            description: 'Pay final expenses, debts, and file all required tax returns before distributing to beneficiaries.',
            guidance: 'You must pay all legitimate debts and taxes before distributing to beneficiaries. Keep receipts for everything.',
            requiredDocs: [
                'Final Form 1040 (decedent personal tax return)',
                'Form 1041 (trust income tax return)',
                'Form 706 (estate tax return, if estate exceeds threshold)',
                'Receipts for all expenses paid'
            ],
            alerts: [
                {
                    type: "important",
                    message: "Tax Deadlines: Form 1040 due by April 15 of year after death. Form 1041 due by April 15 for calendar year trusts. Form 706 due 9 months after death (if required)."
                },
                {
                    type: "warning",
                    message: "Trustee Liability: If you distribute assets before paying taxes and debts, you can be held personally liable for unpaid amounts."
                }
            ],
            estimatedTime: '2-6 months'
        },
        {
            id: 'distribution',
            title: 'Phase 5: Asset Distribution',
            description: 'Distribute trust assets to beneficiaries according to the trust terms.',
            guidance: 'Follow the trust instructions exactly. If the trust says divide equally among my children, you must divide equally. You cannot change the terms.',
            requiredDocs: [
                'Distribution schedule',
                'Beneficiary receipts',
                'Final accounting',
                'Transfer documents for each asset'
            ],
            alerts: [
                {
                    type: "info",
                    message: "Final Accounting: While not always legally required, providing a final accounting to beneficiaries protects you from future disputes."
                },
                {
                    type: "important",
                    message: "Get Receipts: Have each beneficiary sign a receipt acknowledging what they received. This protects you from future claims."
                }
            ],
            estimatedTime: '1-3 months'
        }
    ],
    templates: {
        email: {
            beneficiary_notice: {
                subject: "Notice of Trust Administration - {{trustName}}",
                body: `Dear {{beneficiaryName}},

This letter serves as formal notice that {{deceasedName}} passed away on {{dateOfDeath}}, and I have accepted the role of Successor Trustee of the {{trustName}}.

As required by California Probate Code Section 16061.7, I am providing you with the following information:

1. You are a beneficiary of the trust
2. You have the right to request a copy of the trust document
3. You have 120 days from receipt of this notice to contest the trust or raise any concerns
4. I can be reached at: {{trusteePhone}} or {{trusteeEmail}}

If you would like a copy of the trust document, please contact me in writing at the address below.

The trust administration is proceeding, and I will keep you informed of significant developments.

Sincerely,
{{trusteeName}}
Successor Trustee
{{trusteeAddress}}

Sent via Certified Mail: {{certifiedMailNumber}}`
            },
            institution_notice: {
                subject: "Trust Administration - Certificate of Trust for {{trustName}}",
                body: `Dear {{institutionName}},

I am writing to notify you that {{deceasedName}}, the Trustee of the {{trustName}}, passed away on {{dateOfDeath}}. I have accepted the role of Successor Trustee.

Enclosed please find:
1. Certified Death Certificate
2. Certificate of Trust showing my authority as Successor Trustee
3. My photo identification

Please update your records to reflect my authority to act on behalf of the trust. I will need to:
- Obtain current account balances as of {{dateOfDeath}}
- Review all trust-titled accounts
- Make necessary transfers or distributions

Please contact me at {{trusteePhone}} or {{trusteeEmail}} to discuss next steps.

Thank you for your assistance.

Sincerely,
{{trusteeName}}
Successor Trustee
{{trusteePhone}}
{{trusteeEmail}}`
            },
            cpa_engagement: {
                subject: "Trust Tax Return Preparation - {{trustName}}",
                body: `Dear {{cpaName}},

I am the Successor Trustee of the {{trustName}} following the death of {{deceasedName}} on {{dateOfDeath}}.

I need assistance preparing the following tax returns:
1. Final Form 1040 for {{deceasedName}} ({{taxYear}})
2. Form 1041 for the trust (if required)
3. Form 706 estate tax return (estate value: approximately ${{ estateValue }})

I have gathered the following documents:
- Trust asset inventory
- Income statements for {{taxYear}}
- Expense receipts

Could we schedule a meeting to discuss the tax filing requirements and timeline?

Thank you,
{{trusteeName}}
{{trusteePhone}}
{{trusteeEmail}}`
            }
        }
    }
};
