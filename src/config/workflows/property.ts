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
            id: 'appraisal',
            title: 'Obtain Formal Appraisal',
            description: 'Hire a professional appraiser to determine the fair market value of the property at the date of death.',
            requiredDocs: ['Formal Appraisal Report'],
            estimatedTime: '1-2 weeks'
        },
        {
            id: 'notify_insurance',
            title: 'Update Homeowners Insurance',
            description: 'Contact the insurance company to ensure the property is covered during the probate period, especially if it is vacant.',
            guidance: 'Unoccupied properties often need a special insurance rider.',
            estimatedTime: '1 day'
        },
        {
            id: 'affidavit_death',
            title: 'Record Affidavit of Death',
            description: 'Record an Affidavit of Death of Joint Tenant or similar document with the County Recorder to update the public title.',
            requiredDocs: ['Death Certificate', 'Affidavit of Death'],
            estimatedTime: '1-3 weeks'
        },
        {
            id: 'transfer_deed',
            title: 'Record New Deed',
            description: 'Once authorized by the court, record a new deed transferring the property to the heirs or a buyer.',
            requiredDocs: ['Certified Order for Distribution', 'Grant Deed'],
            estimatedTime: '2-4 weeks'
        }
    ],
    templates: {}
};
