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

export const bankWorkflow: WorkflowConfig = {
    institution: "{{institution}}",
    category: "financial",
    steps: [
        {
            id: 'notify_bank',
            title: 'Notify Bank of Death',
            description: 'Call or visit the local branch to report the death. This will usually freeze the account to prevent unauthorized access.',
            guidance: 'Most banks require an original death certificate to begin the process.',
            estimatedTime: '30 minutes'
        },
        {
            id: 'obtain_balance',
            title: 'Obtain Final Balance',
            description: 'Request a formal date-of-death balance statement for estate tax and inventory purposes.',
            requiredDocs: ['Death Certificate'],
            estimatedTime: '1 week'
        },
        {
            id: 'present_authority',
            title: 'Present Letters & ID',
            description: 'Provide the bank with a certified copy of your Letters (DE-150) and your government-issued ID.',
            requiredDocs: ['Letters (DE-150)', 'Executor ID Card'],
            estimatedTime: 'Agent dependent'
        },
        {
            id: 'close_account',
            title: 'Close & Transfer Funds',
            description: 'Instruct the bank to close the account and issue a check to the "Estate of [Deceased Name]" or transfer to an estate account.',
            estimatedTime: '1-2 weeks'
        }
    ],
    templates: {}
};
