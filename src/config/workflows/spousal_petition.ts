import { WorkflowConfig } from './bank';

export const spousalPetitionWorkflow: WorkflowConfig = {
    institution: "{{courtName}}",
    category: "court_petition",
    steps: [
        {
            id: 'eligibility_check',
            title: 'Phase 1: Eligibility Verification',
            description: 'Confirm you qualify for the streamlined Spousal Property Petition instead of full probate.',
            guidance: 'Only surviving spouses in community property states can use this simplified process. You must be married to the decedent at time of death.',
            requiredDocs: [
                'Marriage Certificate',
                'Death Certificate',
                'Property deeds or account statements'
            ],
            alerts: [
                {
                    type: "important",
                    message: "Community Property Requirement: This process only works for assets that were community property. Separate property must go through regular probate."
                }
            ],
            estimatedTime: '1-2 days'
        },
        {
            id: 'document_assembly',
            title: 'Phase 2: Document Assembly',
            description: 'Gather all required documents for the petition filing.',
            guidance: 'Collect certified copies of key documents. Most courts require originals or certified copies, not photocopies.',
            requiredDocs: [
                'Certified Death Certificate (3 copies)',
                'Certified Marriage Certificate',
                'Property deeds showing community property',
                'Bank/brokerage statements at date of death',
                'Vehicle titles (if applicable)',
                'List of all community property assets'
            ],
            estimatedTime: '3-5 days'
        },
        {
            id: 'petition_preparation',
            title: 'Phase 3: Petition Preparation (DE-221)',
            description: 'Complete the Spousal Property Petition form and prepare for filing.',
            guidance: 'The DE-221 form must list all community property you want transferred. Be thorough and accurate.',
            requiredDocs: [
                'Completed DE-221 form',
                'Property description schedule',
                'Proof of community property ownership'
            ],
            alerts: [
                {
                    type: "info",
                    message: "Filing Fees: Expect to pay $435-$465 in court filing fees (varies by county). Fee waivers available if you qualify."
                }
            ],
            requiresNotary: true,
            estimatedTime: '2-3 days'
        },
        {
            id: 'court_filing',
            title: 'Phase 4: Court Filing',
            description: 'File the petition with the probate court and serve notice.',
            guidance: 'File in the county where the decedent lived. You will receive a hearing date, typically 4-6 weeks out.',
            requiredDocs: [
                'Original DE-221 petition',
                'Filing fee payment',
                'Self-addressed stamped envelope'
            ],
            alerts: [
                {
                    type: "warning",
                    message: "Notice Requirement: You must publish notice in a local newspaper and serve all heirs. The court will provide specific instructions."
                }
            ],
            estimatedTime: '1 day to file, 4-6 weeks until hearing'
        },
        {
            id: 'hearing_attendance',
            title: 'Phase 5: Court Hearing',
            description: 'Attend the court hearing and answer any questions from the judge.',
            guidance: 'Bring all original documents. The hearing is usually brief if everything is in order.',
            requiredDocs: [
                'Photo ID',
                'All original documents',
                'Proof of notice publication',
                'Proof of service to heirs'
            ],
            alerts: [
                {
                    type: "info",
                    message: "What to Expect: The judge will verify you are the surviving spouse, confirm the property was community property, and ensure proper notice was given."
                }
            ],
            estimatedTime: '15-30 minutes'
        },
        {
            id: 'order_issuance',
            title: 'Phase 6: Order Issuance (DE-226)',
            description: 'Receive the court order confirming your ownership of the community property.',
            guidance: 'The court will issue a Spousal Property Order (DE-226). Get certified copies for each asset you need to transfer.',
            requiredDocs: [
                'Certified copies of DE-226 order (3-5 copies recommended)'
            ],
            alerts: [
                {
                    type: "important",
                    message: "Certified Copies: You will need a certified copy of the order for each bank, brokerage, and the county recorder. Order extras to save time."
                }
            ],
            estimatedTime: '1-2 weeks after hearing'
        },
        {
            id: 'asset_transfer',
            title: 'Phase 7: Asset Transfer',
            description: 'Use the court order to transfer assets into your name.',
            guidance: 'Present the certified DE-226 order to each institution. They will transfer the assets from joint names or decedent name to your sole name.',
            requiredDocs: [
                'Certified DE-226 order',
                'Death Certificate',
                'Your photo ID'
            ],
            alerts: [
                {
                    type: "info",
                    message: "Real Estate: For real property, record the DE-226 order with the county recorder in the county where the property is located."
                }
            ],
            estimatedTime: '2-4 weeks'
        }
    ],
    templates: {
        email: {
            court_inquiry: {
                subject: "Spousal Property Petition Filing - {{deceasedName}} Estate",
                body: `Dear {{courtName}} Probate Division,

I am the surviving spouse of {{deceasedName}}, who passed away on {{dateOfDeath}}. I am writing to inquire about filing a Spousal Property Petition (DE-221) to transfer community property assets.

Could you please provide:
1. Current filing fee amount
2. Required number of certified death certificate copies
3. Hearing date availability
4. Notice publication requirements for {{countyName}} County

I have gathered the necessary documents and am ready to file as soon as I receive this information.

Thank you for your assistance.

Sincerely,
{{survivingSpouseName}}
{{contactPhone}}
{{contactEmail}}`
            },
            clerk_followup: {
                subject: "Hearing Date Confirmation - {{deceasedName}} Spousal Petition",
                body: `Dear Probate Clerk,

I filed a Spousal Property Petition (Case #{{caseNumber}}) on {{filingDate}} for the estate of {{deceasedName}}.

I am writing to confirm:
1. The hearing date and time
2. Courtroom location
3. Whether I need to bring any additional documents
4. Proof of notice publication deadline

Please let me know if you need any additional information from me.

Thank you,
{{survivingSpouseName}}
{{contactPhone}}`
            },
            title_company: {
                subject: "Spousal Property Order - {{propertyAddress}}",
                body: `Dear Title Officer,

I am the surviving spouse of {{deceasedName}} and have obtained a Spousal Property Order (DE-226) from {{courtName}} confirming my sole ownership of the property at {{propertyAddress}}.

I am enclosing:
1. Certified copy of Spousal Property Order (DE-226)
2. Certified Death Certificate
3. Recorded deed

Please update the title to reflect my sole ownership and provide a preliminary title report.

Thank you,
{{survivingSpouseName}}
{{contactPhone}}
{{contactEmail}}`
            }
        }
    }
};
