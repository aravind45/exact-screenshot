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
            title: 'Phase 1: Freeze & Protect',
            description: 'Immediate account security. Notify the bank to "lock" the account, stopping unauthorized access and automatic bills.',
            script: "I am calling to formally notify {{institution}} of the death of {{deceasedName}}. Please place an immediate 'Estate Freeze' on account #{{accountNumber}} for heir protection.",
            alerts: [
                {
                    type: "important",
                    message: "Why we do this: Freezing prevents identity theft and 'leaky' withdrawals that drain the estate before you take control."
                }
            ],
            guidance: 'Action: Use the "Smart Email Draft" to send a formal legal notice. This starts your official audit trail.',
            estimatedTime: '30 minutes'
        },
        {
            id: 'obtain_balance',
            title: 'Phase 2: Discovery (DOD Valuation)',
            description: 'Request the official "Date-of-Death" balance. You cannot report the estate value to the Court without this verified snapshot.',
            requiredDocs: ['Death Certificate'],
            guidance: "Why we do this: The Judge requires a 'Snapshot' of wealth at the exact second of death for the official Inventory & Appraisal.",
            estimatedTime: '1 week'
        },
        {
            id: 'submit_docs',
            title: 'Phase 3: Unlock (Present Authority)',
            description: 'Submit your certified Court Letters (DE-150). This proves to the bank that you are the only one legally allowed to move this money.',
            requiredDocs: ['Letters (DE-150)', 'Executor ID Card'],
            alerts: [
                {
                    type: "info",
                    message: "Why we do this: Banks are legally prohibited from releasing assets until they verify your court-appointed power (the 'Letters')."
                }
            ],
            estimatedTime: '1-3 days'
        },
        {
            id: 'final_distribution',
            title: 'Phase 4: Move & Distribute',
            description: 'Clean up the account. Transfer the final balance to your Estate Account or directly to the heirs named in the Will.',
            guidance: 'Why we do this: This is the finish line. We are moving the assets from the deceased’s name into the hands of the living.',
            estimatedTime: '1-2 weeks'
        }
    ],
    templates: {}
};
