import { WorkflowConfig } from './bank';

export const jointTransferWorkflow: WorkflowConfig = {
    institution: "{{institution}}",
    category: "automatic_transfer",
    steps: [
        {
            id: 'verify_ownership',
            title: 'Phase 1: Verify Joint Ownership Type',
            description: 'Confirm the asset is held as Joint Tenants with Right of Survivorship (JTWROS), not Tenants in Common (TIC).',
            guidance: 'This is CRITICAL. Only JTWROS transfers automatically to the survivor. Tenants in Common (TIC) requires probate for the deceased owner share.',
            requiredDocs: [
                'Account statement or deed showing ownership type',
                'Original title document'
            ],
            alerts: [
                {
                    type: "caution",
                    message: "Ownership Type Matters: If the account or property is held as Tenants in Common (TIC), it does NOT transfer automatically. You will need to go through probate for the deceased owner share."
                },
                {
                    type: "info",
                    message: "How to Tell: Look for phrases like Joint Tenants with Right of Survivorship, JTWROS, or Joint Tenants. If it just says Tenants in Common or TIC, automatic transfer does not apply."
                }
            ],
            estimatedTime: '1 day'
        },
        {
            id: 'gather_documents',
            title: 'Phase 2: Gather Required Documents',
            description: 'Collect the death certificate, affidavit of death, and your identification.',
            guidance: 'Most institutions require a certified death certificate and a completed affidavit stating the co-owner has died.',
            requiredDocs: [
                'Certified Death Certificate (2-3 copies)',
                'Affidavit of Death of Joint Tenant',
                'Your photo ID',
                'Original account statement or deed'
            ],
            alerts: [
                {
                    type: "info",
                    message: "Affidavit of Death: This is a simple form stating that your joint tenant has died. Many institutions provide their own form, or you can use a standard notarized affidavit."
                }
            ],
            requiresNotary: true,
            estimatedTime: '3-5 days'
        },
        {
            id: 'submit_claim',
            title: 'Phase 3: Submit Transfer Request',
            description: 'Contact the institution and submit your claim for transfer to sole ownership.',
            guidance: 'Each bank, brokerage, or county recorder has their own process. Call first to ask what they need.',
            requiredDocs: [
                'Completed claim form (institution-specific)',
                'Certified Death Certificate',
                'Affidavit of Death',
                'Your ID'
            ],
            alerts: [
                {
                    type: "warning",
                    message: "Real Estate: For real property, you must record the Affidavit of Death with the county recorder in the county where the property is located. This removes the deceased co-owner from title."
                }
            ],
            estimatedTime: '1-2 weeks'
        },
        {
            id: 'complete_transfer',
            title: 'Phase 4: Complete Transfer',
            description: 'Verify the asset has been transferred to your sole name and update beneficiary designations.',
            guidance: 'Once the transfer is complete, update your beneficiary designations and consider estate planning for the future.',
            requiredDocs: [
                'New account statement showing sole ownership',
                'Updated deed (for real estate)',
                'Beneficiary designation forms'
            ],
            alerts: [
                {
                    type: "info",
                    message: "Update Your Estate Plan: Now that you are the sole owner, make sure your Will, trust, and beneficiary designations are up to date."
                }
            ],
            estimatedTime: '1-2 weeks'
        }
    ],
    templates: {
        email: {
            institution_request: {
                subject: "Joint Account Transfer Request - Account {{accountNumber}}",
                body: `Dear {{institutionName}},

I am writing to request transfer of a joint account to my sole ownership following the death of the co-owner, {{deceasedName}}, who passed away on {{dateOfDeath}}.

Account Information:
- Account Number: {{accountNumber}}
- Account Type: {{accountType}}
- Ownership: Joint Tenants with Right of Survivorship

I am enclosing:
1. Certified Death Certificate
2. Affidavit of Death of Joint Tenant
3. My photo identification

Please transfer this account to my sole name and provide an updated account statement.

If you need any additional documentation, please contact me at {{survivorPhone}} or {{survivorEmail}}.

Thank you for your assistance.

Sincerely,
{{survivorName}}
{{survivorPhone}}
{{survivorEmail}}`
            },
            county_recorder: {
                subject: "Recording Affidavit of Death - {{propertyAddress}}",
                body: `Dear County Recorder,

I am writing to record an Affidavit of Death of Joint Tenant for the property located at {{propertyAddress}}.

The co-owner, {{deceasedName}}, passed away on {{dateOfDeath}}. The property was held as Joint Tenants with Right of Survivorship, and I am the surviving joint tenant.

Enclosed please find:
1. Original notarized Affidavit of Death of Joint Tenant
2. Certified Death Certificate
3. Recording fee payment

Please record this affidavit and return a certified copy to the address below.

Thank you,
{{survivorName}}
{{survivorAddress}}
{{survivorPhone}}`
            }
        }
    }
};
