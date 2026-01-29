export interface WorkflowStep {
    id: string;
    title: string;
    description: string;
    phone?: string;
    script?: string;
    requiredDocs?: string[];
    alerts?: { type: "info" | "warning" | "important" | "caution"; message: string }[];
    estimatedTime?: string;
    guidance?: string;
    condition?: (asset: any) => boolean;
    requiresNotary?: boolean;
    requiresPhysicalMail?: boolean;
}

export interface WorkflowConfig {
    institution: string;
    category: string;
    steps: WorkflowStep[];
    templates: {
        email?: Record<string, { subject: string; body: string }>;
        phone?: Record<string, string>;
        fax?: Record<string, string>;
    };
}

export const propertyWorkflow: WorkflowConfig = {
    institution: "{{institution}}",
    category: "property",
    steps: [
        {
            id: 'initial_notification',
            title: 'Phase 1: Valuation & Base Lock',
            description: 'Determine the professional Fair Market Value (FMV) as of the exact date of death.',
            requiredDocs: ['Formal Appraisal Report'],
            alerts: [
                {
                    type: "important",
                    message: "Why we do this: This establishes the 'Step-up in Basis'. It wipes out decades of capital gains tax liability for the heirs in one legal snapshot."
                }
            ],
            guidance: 'Action: Hire a probate-certified appraiser. This value is the foundation of your court accounting.',
            estimatedTime: '1-2 weeks'
        },
        {
            id: 'notify_insurance',
            title: 'Phase 2: Risk Management',
            description: 'Secure the property. Notify the insurance carrier of the vacancy and confirm the estate’s liability coverage.',
            guidance: 'Why we do this: Unoccupied probate homes are high-risk. Failure to notify insurance can lead to a total loss if a pipe bursts or a fire occurs.',
            estimatedTime: '1 day'
        },
        {
            id: 'submit_docs',
            title: 'Phase 3: Public Authority (Title)',
            description: 'Record your Court Letters (DE-150) and the Affidavit of Death with the County. This takes the house out of the deceased’s name.',
            requiredDocs: ['Death Certificate', 'Affidavit of Death', 'Letters (DE-150)'],
            guidance: 'Why we do this: You cannot sell or refinance a house that legally still belongs to a deceased person. This step updates the public record to show YOU have the power to sign deeds.',
            estimatedTime: '1-3 weeks',
            requiresNotary: true,
            requiresPhysicalMail: true
        },
        {
            id: 'final_distribution',
            title: 'Phase 4: Transfer & Distribution',
            description: 'The final move. Record the new Grant Deed transferring ownership to the heirs or a buyer.',
            requiredDocs: ['Certified Order for Distribution', 'Grant Deed'],
            guidance: 'Why we do this: The legal finish line. This is the moment when the heirs finally become the official, legal owners of the home.',
            estimatedTime: '2-4 weeks',
            requiresNotary: true,
            requiresPhysicalMail: true
        }
    ],
    templates: {}
};
