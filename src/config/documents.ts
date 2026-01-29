/**
 * Central Document Registry
 * 
 * Maps canonical form codes to metadata, including common aliases
 * and the roadmap task they correspond to. Supports all 9 settlement tracks.
 */

export interface DocumentEntry {
    code: string;
    name: string;
    aliases: string[];
    roadmapTaskId: string;
    category: 'probate' | 'court-issued' | 'prep';
}

export const DOCUMENT_REGISTRY: DocumentEntry[] = [
    // --- Phase 1: Court Filing / Action ---
    {
        code: "DE-111",
        name: "Petition for Probate",
        aliases: ["Petition", "DE111", "Petition for Probate Form", "Probate Petition"],
        roadmapTaskId: "file_petition",
        category: "prep"
    },
    {
        code: "DE-121",
        name: "Notice of Hearing",
        aliases: ["Notice of Petition", "Notice of Hearing Form", "DE121"],
        roadmapTaskId: "file_petition",
        category: "prep"
    },
    {
        code: "DE-130",
        name: "Proof of Publication",
        aliases: ["Publication Proof", "Proof of Publication (DE-130)", "DE130", "managespousal"], // matching user's recent attempt
        roadmapTaskId: "publish_notice",
        category: "prep"
    },
    {
        code: "DE-150",
        name: "Letters Testamentary",
        aliases: ["Letters", "DE150", "Letters of Administration", "Letters of Guardianship"],
        roadmapTaskId: "receive_letters",
        category: "court-issued"
    },
    {
        code: "DE-310",
        name: "Small Estate Affidavit",
        aliases: ["Affidavit", "Small Estate", "DE310", "Affidavit for Collection"],
        roadmapTaskId: "file_affidavit",
        category: "court-issued"
    },
    {
        code: "DE-221",
        name: "Spousal Property Petition",
        aliases: ["Spousal Petition", "DE221", "managespousal", "Spousal Property Petition (DE-221)"],
        roadmapTaskId: "file_spousal_petition",
        category: "prep"
    },
    {
        code: "TRUST_CERT",
        name: "Certification of Trust",
        aliases: ["Trust Certification", "Trust Docs", "Trust Cert", "Certificate of Trust"],
        roadmapTaskId: "issue_cert_trust",
        category: "prep"
    },
    {
        code: "DE-157",
        name: "Notice to Creditors",
        aliases: ["Creditor Notice", "DE157", "Notice of Administration to Creditors"],
        roadmapTaskId: "mail_notice",
        category: "prep"
    },

    // --- Phase 2: Asset Discovery & Inventory ---
    {
        code: "Death Certificate",
        name: "Certified Death Certificate",
        aliases: ["Death Cert", "DC", "Copy of Death Certificate"],
        roadmapTaskId: "notify_ssa",
        category: "prep"
    },
    {
        code: "Original Will",
        name: "Original Last Will & Testament",
        aliases: ["Will", "Testament", "Last Will"],
        roadmapTaskId: "locate_will",
        category: "prep"
    },
    {
        code: "DE-160",
        name: "Inventory and Appraisal",
        aliases: ["Inventory", "I&A", "DE160", "Inventory & Appraisal (DE-160)"],
        roadmapTaskId: "complete_inventory",
        category: "prep"
    },
    {
        code: "DE-315",
        name: "Inventory & Appraisal (Small Estate)",
        aliases: ["Small Estate I&A", "DE315"],
        roadmapTaskId: "complete_inventory",
        category: "prep"
    },

    // --- Phase 3: Creditor Claims ---
    {
        code: "DE-172",
        name: "Creditor's Claim",
        aliases: ["Claim", "DE172"],
        roadmapTaskId: "review_claims",
        category: "prep"
    },
    {
        code: "DE-174",
        name: "Allowance or Rejection of Creditor's Claim",
        aliases: ["Rejection", "Allowance", "DE174", "Claim Action"],
        roadmapTaskId: "reject_invalid",
        category: "prep"
    },

    // --- Phase 4: Final Accounting & Distribution ---
    {
        code: "DE-295",
        name: "Petition for Final Discharge",
        aliases: ["Final Discharge", "Ex Parte Petition for Final Discharge", "DE295"],
        roadmapTaskId: "close_estate",
        category: "prep"
    },
    {
        code: "HEIR_RECEIPT",
        name: "Receipt of Beneficiary",
        aliases: ["Receipt", "Beneficiary Receipt", "Distribution Receipt"],
        roadmapTaskId: "distribute_assets",
        category: "prep"
    },
    {
        code: "FINAL_ORDER",
        name: "Order for Final Distribution",
        aliases: ["Final Order", "Distribution Order"],
        roadmapTaskId: "distribute_assets",
        category: "court-issued"
    }
];

export const findCanonicalDoc = (typeOrName: string) => {
    if (!typeOrName) return null;
    const lower = typeOrName.toLowerCase();
    return DOCUMENT_REGISTRY.find(doc =>
        doc.code.toLowerCase() === lower ||
        doc.name.toLowerCase() === lower ||
        doc.aliases.some(a => a.toLowerCase() === lower || lower.includes(a.toLowerCase()))
    );
};
