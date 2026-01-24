
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
    institution: "Fidelity",
    category: "financial",
    steps: [
        {
            id: "initial_notification",
            title: "Notify Fidelity",
            description: "Inform Fidelity Estate Services of the death to lock accounts and begin the formal review.",
            phone: "1-800-544-0003",
            script: "I'm calling to notify Fidelity of the death of {{deceasedName}}. I am the {{userRole}} and need to start the estate settlement process.",
            guidance: "Fidelity will 'flag' the accounts. This prevents unauthorized trades but allows dividends to accrue.",
            estimatedTime: "20 minutes"
        },
        {
            id: "account_classification",
            title: "Determine Titling",
            description: "Fidelity determines how each account is held, which dictates the distribution path.",
            alerts: [
                {
                    type: "info",
                    message: "Current asset is classified as: {{ownershipType}}."
                }
            ],
            guidance: "If the account has beneficiaries (TOD/IRA), it bypasses probate. Individual accounts (no TOD) require court authority.",
            estimatedTime: "Instant"
        },
        {
            id: "probate_filing",
            title: "Obtain Court Authority",
            description: "For Individual accounts, you must file with the court to be appointed as Executor.",
            condition: (asset) => asset.ownershipType === "INDIVIDUAL",
            requiredDocs: [
                "Letters Testamentary (Executor Appointment)",
                "Small Estate Affidavit (if applicable)"
            ],
            alerts: [
                {
                    type: "important",
                    message: "Fidelity will NOT release Individual/Sole-owner assets without court appointment documents."
                }
            ],
            guidance: "This step is skipped for Trust or Beneficiary accounts.",
            estimatedTime: "4-12 weeks (Court dependent)"
        },
        {
            id: "beneficiary_claim",
            title: "Submit Beneficiary Claim",
            description: "Beneficiaries must submit a claim form to retitle or distribute the assets.",
            condition: (asset) => asset.ownershipType === "BENEFICIARY",
            requiredDocs: [
                "Beneficiary Claim Form",
                "Certified copy of Death Certificate"
            ],
            guidance: "Distribution usually happens in 2-4 weeks for named beneficiaries.",
            estimatedTime: "2-4 weeks"
        },
        {
            id: "trust_transition",
            title: "Trustee Control",
            description: "The successor trustee takes control of accounts held within the trust.",
            condition: (asset) => asset.ownershipType === "TRUST",
            requiredDocs: [
                "Certificate of Trust",
                "Successor Trustee ID verification"
            ],
            guidance: "Trust assets bypass probate and can be managed immediately by the trustee.",
            estimatedTime: "1-2 weeks"
        },
        {
            id: "joint_survivorship",
            title: "Retitle Joint Account",
            description: "Assets pass automatically to the surviving owner upon submission of the death certificate.",
            condition: (asset) => asset.ownershipType === "JOINT",
            requiredDocs: [
                "Certified copy of Death Certificate",
                "New Account Application for survivor"
            ],
            estimatedTime: "1-2 weeks"
        },
        {
            id: "final_distribution",
            title: "Distribution & Basis Update",
            description: "Assets are retitled, rolled over, or liquidated.",
            alerts: [
                {
                    type: "info",
                    message: "Tip: Most brokerage assets receive a 'Step-up' in cost basis to the date of death value."
                }
            ],
            guidance: "Coordinate with a CPA regarding the final 1099-R and 1099-DIV forms in January.",
            estimatedTime: "1-2 weeks"
        }
    ],
    templates: {
        email: {
            status_update: {
                subject: "Status Update Request - Estate Settlement - Account #{{accountNumber}}",
                body: "Dear Fidelity Estate Services,\n\nI am writing to request a status update on the settlement of account #{{accountNumber}} for the estate of {{deceasedName}}.\n\nPlease let me know if any further documentation is required.\n\nThank you,\n[Your Name]"
            }
        }
    }
};
