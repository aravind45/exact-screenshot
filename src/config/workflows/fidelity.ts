
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
    condition?: (asset: any) => boolean; // Optional condition to show/hide step
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

export const fidelityWorkflow: WorkflowConfig = {
    institution: "{{institution}}",
    category: "financial",
    steps: [
        {
            id: "initial_notification",
            title: "Phase 1: Death Alert & Account Freeze",
            description: "Inform {{institution}} Estate Services of the death to secure the account and begin the forensic review.",
            phone: "{{institutionPhone}}",
            script: "I'm calling to formally notify {{institution}} of the death of {{deceasedName}} on behalf of the estate. Please lock all accounts for account holder account #{{accountNumber}} and identify any TOD or beneficiary designations.",
            guidance: "This action protects the holdings from unauthorized trades or transfers. You should follow up immediately with a formal letter.",
            estimatedTime: "20 minutes"
        },
        {
            id: "account_classification",
            title: "Phase 2: Distribution Classification",
            description: "{{institution}} determines if assets bypass probate (TOD) or require court authority (Individual).",
            alerts: [
                {
                    type: "info",
                    message: "Current asset classification: {{ownershipType}}."
                }
            ],
            guidance: "If classified as INDIVIDUAL, you MUST provide Letters Testamentary (Phase 3) before any money can move.",
            estimatedTime: "Instant"
        },
        {
            id: "submit_docs",
            title: "Phase 3: Formal Authority Submission",
            description: "Provide the court-certified documents that prove you have the right to move this money.",
            condition: (asset) => asset.ownershipType === "INDIVIDUAL",
            requiredDocs: [
                "Letters Testamentary (DE-150)",
                "Order for Probate (DE-140)",
                "Certified Death Certificate"
            ],
            alerts: [
                {
                    type: "important",
                    message: "A 'Letter of Instruction' is often required alongside your court documents to specify where the funds go."
                }
            ],
            guidance: "Use the 'Fax Integration' tool below once you've uploaded your documents to speed up processing.",
            estimatedTime: "1-2 days"
        },
        {
            id: "small_estate_path",
            title: "Phase 3: Small Estate Processing",
            description: "Submit a sworn affidavit to collect assets for estates under the state probate limit.",
            condition: (asset) => asset.ownershipType === "SMALL_ESTATE_ELIGIBLE",
            requiredDocs: [
                "Notarized Small Estate Affidavit",
                "Certified Death Certificate",
                "Valid ID"
            ],
            guidance: "This bypasses full probate but requires specific state-level paperwork.",
            estimatedTime: "2-6 weeks"
        },
        {
            id: "final_distribution",
            title: "Phase 4: Asset Distribution & Step-Up",
            description: "Ensure assets receive a 'Step-up' in cost basis and are transferred to heirs.",
            alerts: [
                {
                    type: "caution",
                    message: "Confirm the 'Cost Basis' is updated to the Date of Death value to minimize future capital gains taxes."
                }
            ],
            guidance: "Final step: Once accounts are zeroed out, request a final closing statement for your records.",
            estimatedTime: "2-4 weeks"
        }
    ],
    templates: {
        email: {
            status_update: {
                subject: "Status Update Request - Estate Settlement - Account #{{accountNumber}}",
                body: "Dear {{institution}} Estate Services,\n\nI am writing to request a status update on the settlement of account #{{accountNumber}} for the estate of {{deceasedName}}.\n\nPlease let me know if any further documentation is required.\n\nThank you,\n[Your Name]"
            }
        }
    }
};
