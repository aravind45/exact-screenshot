
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
            title: "Notify {{institution}}",
            description: "Inform {{institution}} Estate Services of the death to lock accounts and begin the formal review.",
            phone: "{{institutionPhone}}",
            script: "I'm calling to notify {{institution}} of the death of {{deceasedName}}. I am the {{userRole}} and need to start the estate settlement process.",
            guidance: "{{institution}} will 'flag' the accounts. This prevents unauthorized trades but allows dividends to accrue.",
            estimatedTime: "20 minutes"
        },
        {
            id: "account_classification",
            title: "Determine Titling",
            description: "{{institution}} determines how each account is held, which dictates the distribution path.",
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
            title: "Phase 1: Legal Authority (Letters Testamentary)",
            description: "For Individual accounts, you must be court-appointed as the Executor.",
            condition: (asset) => asset.ownershipType === "INDIVIDUAL",
            requiredDocs: [
                "Original Will (if any)",
                "Certified Death Certificate",
                "Probate Petition Form",
                "Letters Testamentary (Outcome)"
            ],
            alerts: [
                {
                    type: "important",
                    message: "Real-World Rule: {{institution}} will NOT release assets without court appointment documents."
                }
            ],
            guidance: "Process: 1. File Petition with County Court. 2. Notify all Heirs/Beneficiaries. 3. Attend hearing (if required). 4. Request 10+ certified copies of the Letters.",
            estimatedTime: "4-12 weeks"
        },
        {
            id: "small_estate_path",
            title: "Phase 1: Small Estate Affidavit",
            description: "A sworn affidavit to collect assets without full court probate.",
            condition: (asset) => asset.ownershipType === "SMALL_ESTATE_ELIGIBLE", // We'll need to pass this flag in asset detail
            requiredDocs: [
                "Notarized Small Estate Affidavit",
                "Certified Death Certificate",
                "Valid ID for all heirs"
            ],
            guidance: "Process: 1. Verify total probate assets are below state limit. 2. Wait the required period (e.g., 40 days in CA). 3. Sign before a Notary. 4. Submit directly to {{institution}}.",
            estimatedTime: "2-6 weeks"
        },
        {
            id: "beneficiary_claim",
            title: "Phase 2: Submit Distribution Claim",
            description: "Finalize the transfer of assets to the estate account or beneficiaries.",
            alerts: [
                {
                    type: "caution",
                    message: "Locked: You must complete 'Phase 1' and obtain legal authority before {{institution}} will process this claim."
                }
            ],
            guidance: "Once authorized, submit the claim form along with your certified authority document.",
            estimatedTime: "2-4 weeks"
        },
        {
            id: "final_distribution",
            title: "Phase 3: Basis Update & Close",
            description: "Ensure assets receive a 'Step-up' in cost basis and accounts are closed.",
            guidance: "Confirm with your tax advisor that the 'cost basis' has been updated to the date of death value to minimize future taxes.",
            estimatedTime: "1 week"
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
