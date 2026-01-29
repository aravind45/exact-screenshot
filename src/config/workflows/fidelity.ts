
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

export const fidelityWorkflow: WorkflowConfig = {
    institution: "{{institution}}",
    category: "financial",
    steps: [
        {
            id: "initial_notification",
            title: "Phase 1: Freeze & Secure",
            description: "Inform {{institution}} of the death to lock the account. This prevents market volatility or unauthorized access while the estate is settled.",
            phone: "{{institutionPhone}}",
            script: "I'm calling to notify {{institution}} of the death of {{deceasedName}}. Please place an immediate 'Estate Freeze' on account #{{accountNumber}} and identify any TOD designations.",
            guidance: "Why we do this: Freezing stops 'The Clock'. It protects the volatility of stocks and prevents automatic sales or transfers that would happen without your consent.",
            estimatedTime: "20 minutes"
        },
        {
            id: "account_classification",
            title: "Phase 2: Distribution Discovery",
            description: "Verify if these assets bypass probate (TOD/Beneficiary) or are part of the formal court estate.",
            alerts: [
                {
                    type: "info",
                    message: "Why we do this: Unlike cash in a bank, brokerage accounts often have 'Secret Exit Paths' (TODs) that save you months of probate if identified early."
                }
            ],
            guidance: "Action: If identified as INDIVIDUAL, the court must now supervise the transfer (Phase 3).",
            estimatedTime: "Instant"
        },
        {
            id: "submit_docs",
            title: "Phase 3: Unlock (Authority)",
            description: "Provide the Court-certified Letters (DE-150) and identification. This is the legal 'Key' to the investment vault.",
            condition: (asset) => asset.ownershipType === "INDIVIDUAL",
            requiredDocs: [
                "Letters Testamentary (DE-150)",
                "Order for Probate (DE-140)",
                "Certified Death Certificate"
            ],
            alerts: [
                {
                    type: "important",
                    message: "Why we do this: Institutions are strictly liabile for 'Wrongful Distribution'. They won't move until they see the Judge's seal on your Letters."
                }
            ],
            guidance: "Pro-Tip: Use our Fax Tool to send your DE-150 directly to the Estate department to bypass the snail mail delay.",
            estimatedTime: "1-2 days",
            requiresPhysicalMail: true
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
            estimatedTime: "2-6 weeks",
            requiresNotary: true,
            requiresPhysicalMail: true
        },
        {
            id: "final_distribution",
            title: "Phase 4: Cost Basis & Transfer",
            description: "The 'Finish Line'. Ensure the taxable value is reset (Step-Up) and the stocks move to the final beneficiaries.",
            alerts: [
                {
                    type: "caution",
                    message: "Why we do this: This is the most important financial tax-saver in probate. We verify the 'Cost Basis' is reset to DOD value, potentially saving heirs thousands in taxes."
                }
            ],
            guidance: "Action: Instruct {{institution}} to move the positions to the target brokerage accounts.",
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
