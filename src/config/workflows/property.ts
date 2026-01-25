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
            title: 'Phase 1: Appraisal & Value Lock',
            description: 'Hire a professional appraiser to determine the fair market value (FMV) at the date of death.',
            requiredDocs: ['Formal Appraisal Report'],
            alerts: [
                {
                    type: "important",
                    message: "The FMV at the date of death is used to establish the 'Step-up in Basis', which can save thousands in capital gains taxes later."
                }
            ],
            guidance: 'Ensure the appraiser is familiar with "Date of Death" valuations, which may differ from current listing prices.',
            estimatedTime: '1-2 weeks'
        },
        {
            id: 'notify_insurance',
            title: 'Phase 2: Property Security & Insurance',
            description: 'Notify the homeowners insurance carrier to ensure continuous coverage, especially if the property is now vacant.',
            guidance: 'Warning: Vacant properties often require a "Vacancy Rider" or specialized insurance. Failure to notify may void the policy.',
            estimatedTime: '1 day'
        },
        {
            id: 'submit_docs',
            title: 'Phase 3: Title & Ownership Recordation',
            description: 'Record the Affidavit of Death or Certified Order for Distribution with the County Recorder to update the public title.',
            requiredDocs: ['Death Certificate', 'Affidavit of Death', 'Letters (DE-150)'],
            guidance: 'This step formally moves the property out of the deceased\'s name in the public records.',
            estimatedTime: '1-3 weeks'
        },
        {
            id: 'final_distribution',
            title: 'Phase 4: Deed Transfer or Sale',
            description: 'Execute and record a new Grant Deed transferring the property to the final heirs or a third-party buyer.',
            requiredDocs: ['Certified Order for Distribution', 'Grant Deed'],
            estimatedTime: '2-4 weeks'
        }
    ],
    templates: {}
};
