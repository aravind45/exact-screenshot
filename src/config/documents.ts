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
        name: "Petition to Determine Succession to Real Property",
        aliases: ["Succession Petition", "DE310", "Petition to Determine Succession"],
        roadmapTaskId: "file_succession_petition",
        category: "prep"
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
        name: "Order Determining Succession to Real Property",
        aliases: ["Succession Order", "DE315", "Order Determining Succession"],
        roadmapTaskId: "obtain_succession_order",
        category: "court-issued"
    },
    {
        code: "DE-350",
        name: "Petition for Appointment of Guardian Ad Litem—Probate",
        aliases: ["Guardian Ad Litem Petition", "DE350"],
        roadmapTaskId: "petition_guardian_ad_litem",
        category: "prep"
    },
    {
        code: "DE-351",
        name: "Order Appointing Guardian Ad Litem—Probate",
        aliases: ["Guardian Ad Litem Order", "DE351"],
        roadmapTaskId: "obtain_guardian_order",
        category: "court-issued"
    },
    {
        code: "DE-154",
        name: "Request for Special Notice",
        aliases: ["Special Notice Request", "DE154"],
        roadmapTaskId: "track_special_notice_requests",
        category: "prep"
    },
    {
        code: "DE-226",
        name: "Spousal or Domestic Partner Property Order",
        aliases: ["Spousal Order", "DE226", "Spousal Property Order"],
        roadmapTaskId: "obtain_spousal_order",
        category: "court-issued"
    },
    {
        code: "DE-142",
        name: "Waiver of Bond by Heir or Beneficiary",
        aliases: ["Bond Waiver", "DE142"],
        roadmapTaskId: "request_bond_waiver",
        category: "prep"
    },
    {
        code: "DE-143",
        name: "Order Waiving Bond",
        aliases: ["Bond Waiver Order", "DE143", "Bond Order"],
        roadmapTaskId: "obtain_bond_waiver_order",
        category: "court-issued"
    },
    {
        code: "DE-166",
        name: "Waiver of Notice of Proposed Action",
        aliases: ["IAEA Waiver", "DE166", "Waiver of Notice"],
        roadmapTaskId: "prepare_notice_proposed_action",
        category: "prep"
    },
    {
        code: "DE-116",
        name: "Petition for Determination of Will Validity",
        aliases: ["Will Validity", "DE116", "Contest Petition"],
        roadmapTaskId: "respond_to_objections",
        category: "prep"
    },
    {
        code: "DE-130",
        name: "Proof of Publication (Probate)",
        aliases: ["Proof of Publication", "DE130", "Publication Receipt"],
        roadmapTaskId: "publish_notice",
        category: "prep"
    },
    {
        code: "DE-165",
        name: "Notice of Proposed Action",
        aliases: ["Notice of Proposed Action", "DE165", "IAEA Notice"],
        roadmapTaskId: "prepare_notice_proposed_action",
        category: "prep"
    },
    {
        code: "DE-260",
        name: "Report of Sale and Petition for Order Confirming Sale of Real Property",
        aliases: ["Petition to Confirm Sale", "DE260", "Sale Confirmation Petition"],
        roadmapTaskId: "petition_confirm_sale",
        category: "prep"
    },
    {
        code: "DE-265",
        name: "Order Confirming Sale of Real Property",
        aliases: ["Order Confirming Sale", "DE265", "Sale Confirmation Order"],
        roadmapTaskId: "obtain_sale_confirmation_order",
        category: "court-issued"
    },
    {
        code: "DE-115",
        name: "Objection to Probate of Will",
        aliases: ["Objection", "Will Contest", "DE115"],
        roadmapTaskId: "respond_to_objections",
        category: "prep"
    },
    {
        code: "DE-200",
        name: "Order Prescribing Notice",
        aliases: ["Notice Order", "DE200"],
        roadmapTaskId: "resolve_contest", // Often used in complex/contested notice issues
        category: "court-issued"
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
        code: "DE-275",
        name: "Order Confirming Sale of Securities",
        aliases: ["Securities Order", "DE275"],
        roadmapTaskId: "sell_securities",
        category: "court-issued"
    },
    {
        code: "DE-147S",
        name: "Confidential Supplement to Duties and Liabilities",
        aliases: ["Confidential Supplement", "DE147S"],
        roadmapTaskId: "confirm_executor_role",
        category: "prep"
    },
    {
        code: "SECTION_13100",
        name: "Affidavit for Collection of Personal Property",
        aliases: ["Small Estate Affidavit", "13100 Affidavit"],
        roadmapTaskId: "file_affidavit",
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
