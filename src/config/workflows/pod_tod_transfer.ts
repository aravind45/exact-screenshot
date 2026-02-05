import { WorkflowConfig } from './bank';

export const podTodTransferWorkflow: WorkflowConfig = {
    institution: "{{institution}}",
    category: "beneficiary_transfer",
    steps: [
        {
            id: 'verify_beneficiary',
            title: 'Phase 1: Verify Beneficiary Designation',
            description: 'Confirm you are named as the beneficiary on the account or asset.',
            guidance: 'Contact the institution and request a copy of the beneficiary designation form on file. Make sure your name matches exactly.',
            requiredDocs: [
                'Beneficiary designation form (from institution)',
                'Account statement'
            ],
            alerts: [
                {
                    type: "warning",
                    message: "Beneficiary Designation Wins: The beneficiary designation overrides the Will. Even if the Will says something different, the account goes to the named beneficiary."
                },
                {
                    type: "caution",
                    message: "Multiple Beneficiaries: If there are multiple beneficiaries, you will each receive your designated share. Contact the institution to confirm the percentages."
                }
            ],
            estimatedTime: '3-5 days'
        },
        {
            id: 'assemble_claim_packet',
            title: 'Phase 2: Assemble Claim Packet',
            description: 'Gather all required documents for the beneficiary claim.',
            guidance: 'Each institution has specific requirements. Call their beneficiary services department to request the specific claim form and document list.',
            requiredDocs: [
                'Certified Death Certificate (2-3 copies)',
                'Beneficiary claim form (institution-specific)',
                'Your photo ID',
                'Social Security card or W-9 form',
                'Proof of address (utility bill or bank statement)'
            ],
            alerts: [
                {
                    type: "info",
                    message: "Tax Forms: You will need to provide a W-9 form with your Social Security Number for tax reporting. The institution will issue a 1099 for any taxable distributions."
                },
                {
                    type: "warning",
                    message: "Retirement Accounts: If this is an IRA or 401k, there are special tax rules. Consult a tax advisor before taking distributions to avoid unnecessary taxes and penalties."
                }
            ],
            estimatedTime: '1 week'
        },
        {
            id: 'submit_claim',
            title: 'Phase 3: Submit Claim',
            description: 'Submit your completed claim packet to the institution.',
            guidance: 'Submit via certified mail or in person. Keep copies of everything you send.',
            requiredDocs: [
                'Completed claim packet',
                'All supporting documents'
            ],
            alerts: [
                {
                    type: "info",
                    message: "Processing Time: Most institutions process beneficiary claims within 2-4 weeks. Complex cases or retirement accounts may take longer."
                }
            ],
            requiresPhysicalMail: true,
            estimatedTime: '2-4 weeks for processing'
        },
        {
            id: 'receive_transfer',
            title: 'Phase 4: Receive Transfer',
            description: 'Receive the funds or assets and handle tax reporting.',
            guidance: 'You can typically choose to receive funds via check, direct deposit, or transfer to your own account. For retirement accounts, consider tax implications.',
            requiredDocs: [
                'Transfer confirmation',
                'Form 1099 (for tax reporting)'
            ],
            alerts: [
                {
                    type: "important",
                    message: "Tax Reporting: You will receive a Form 1099 reporting the distribution. Keep this for your tax return. For retirement accounts, the distribution is taxable income."
                },
                {
                    type: "info",
                    message: "Inherited IRA Option: If this is a retirement account, you may be able to open an Inherited IRA and take distributions over your lifetime. This can reduce your tax burden. Consult a tax advisor."
                }
            ],
            estimatedTime: '1-2 weeks'
        }
    ],
    templates: {
        email: {
            claim_request: {
                subject: "POD/TOD Beneficiary Claim - Account {{accountNumber}}",
                body: `Dear {{institutionName}} Beneficiary Services,

I am writing to file a beneficiary claim for account {{accountNumber}} following the death of {{deceasedName}}, who passed away on {{dateOfDeath}}.

I am named as a beneficiary on this account. Please send me:
1. Beneficiary claim form
2. List of required documents
3. Current account balance as of date of death
4. Copy of beneficiary designation on file

My contact information:
{{beneficiaryName}}
{{beneficiaryAddress}}
{{beneficiaryPhone}}
{{beneficiaryEmail}}

Thank you for your assistance.

Sincerely,
{{beneficiaryName}}`
            },
            multiple_beneficiaries: {
                subject: "Coordination of Beneficiary Claim - {{accountNumber}}",
                body: `Dear {{coBeneficiaryName}},

I am reaching out because we are both named as beneficiaries on {{deceasedName}} account at {{institutionName}} (Account {{accountNumber}}).

According to the beneficiary designation, the account will be divided as follows:
- {{beneficiary1Name}}: {{beneficiary1Percentage}}
- {{beneficiary2Name}}: {{beneficiary2Percentage}}

I have contacted the institution and they require:
1. Each beneficiary to complete a separate claim form
2. Certified death certificate (I can provide copies)
3. Photo ID for each beneficiary

Would you like to coordinate our claims together, or would you prefer to file independently? Either way, I wanted to make sure you were aware of the account.

Please let me know how you would like to proceed.

Best regards,
{{beneficiaryName}}
{{beneficiaryPhone}}
{{beneficiaryEmail}}`
            },
            tax_advisor: {
                subject: "Inherited Retirement Account - Tax Planning",
                body: `Dear {{advisorName}},

I recently inherited a {{accountType}} from {{deceasedName}} who passed away on {{dateOfDeath}}. The account value is approximately ${{ accountValue }}.

I need guidance on:
1. Whether to take a lump sum distribution or open an Inherited IRA
2. Required Minimum Distributions (RMDs) and timing
3. Tax implications of different distribution options
4. Estate tax considerations (if applicable)

Could we schedule a consultation to discuss the best strategy for minimizing taxes while meeting my financial needs?

Thank you,
{{beneficiaryName}}
{{beneficiaryPhone}}
{{beneficiaryEmail}}`
            }
        }
    }
};
