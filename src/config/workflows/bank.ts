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
            id: 'initial_notification',
            title: 'Phase 1: Notification & Account Security',
            description: 'Formally notify the bank of the death to "freeze" the account and prevent unauthorized transfers.',
            script: "I am calling to formally notify {{institution}} of the death of {{deceasedName}}. I am the court-appointed {{userRole}} and need to place a 'Death Alert' or 'Estate Freeze' on account #{{accountNumber}} immediately.",
            alerts: [
                {
                    type: "important",
                    message: "Freezing the account protects heirs but also stops auto-pays. Ensure mortgage or utility payments are handled separately."
                }
            ],
            guidance: 'Use the "Generate Settlement Notice" tool below to create a formal document for their records.',
            estimatedTime: '30 minutes'
        },
        {
            id: 'obtain_balance',
            title: 'Phase 2: Formal Inventory Request',
            description: 'Request a formal "Date-of-Death" balance statement. This is a legal requirement for court inventory and tax filings.',
            requiredDocs: ['Death Certificate'],
            guidance: "This statement must reflect the exact value at the moment of death, not the current market value.",
            estimatedTime: '1 week'
        },
        {
            id: 'submit_docs',
            title: 'Phase 3: Present Authority (Letters)',
            description: 'Submit your certified Letters Testamentary (DE-150) and identification to the Estate/Trust department.',
            requiredDocs: ['Letters (DE-150)', 'Executor ID Card'],
            alerts: [
                {
                    type: "info",
                    message: "Banks often require a 'Fresh' certified copy of your Letters (usually issued within the last 60 days)."
                }
            ],
            estimatedTime: '1-3 days'
        },
        {
            id: 'final_distribution',
            title: 'Phase 4: Closure & Estate Transfer',
            description: 'Finalize the transfer of all remaining funds to the formal Estate Account or directly to beneficiaries.',
            guidance: 'Instruct the bank to issue a check to the "Estate of [Deceased Name]" if you do not have an estate account yet.',
            estimatedTime: '1-2 weeks'
        }
    ],
    templates: {}
};
