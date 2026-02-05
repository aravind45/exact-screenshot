

export const STATE_THRESHOLDS: Record<string, number> = {
    "CA": 184500,
    "NY": 50000,
    "TX": 75000,
    "FL": 75000,
    "IL": 100000,
    "PA": 50000,
};

// Uniform Probate Code (UPC) states that support Informal Probate
export const UPC_STATES = [
    "AK", "AZ", "CO", "HI", "ID", "ME", "MI", "MN", "MT",
    "NE", "NM", "ND", "SC", "SD", "UT"
];

export type MasterMode =
    | "COURT_SUPERVISED"
    | "FIDUCIARY_ADMINISTERED"
    | "TRANSFER_ONLY";

export type AuthorityType =
    | "FORMAL_PROBATE"
    | "INFORMAL_PROBATE"
    | "SMALL_ESTATE"
    | "SUMMARY_ADMINISTRATION" // e.g. Florida, California variants
    | "VOLUNTARY_ADMINISTRATION" // New York
    | "MUNIMENT_OF_TITLE" // Texas
    | "ANCILLARY_PROBATE" // Secondary state
    | "SPOUSAL_PETITION"
    | "ELECTIVE_SHARE" // Spousal claim
    | "FAMILY_ALLOWANCE" // Interim support
    | "TRUST_ADMIN_REVOCABLE"
    | "TRUST_ADMIN_IRREVOCABLE"
    | "POUR_OVER_WILL" // Hybrid
    | "JOINT_TRANSFER"
    | "POD_TOD_TRANSFER"
    | "BENEFICIARY_DESIGNATED"
    | "TOD_DEED" // Real estate deed
    | "INTESTATE"
    | "INSOLVENT_ESTATE"
    | "ESTATE_WITH_MINORS"
    | "BUSINESS_ESTATE"
    | "CONTESTED_ESTATE"
    | "UNCLAIMED_ESTATE"
    | "DISCOVERY"
    | "UNSET";

export interface AuthorityRecommendation {
    type: AuthorityType;
    masterMode: MasterMode;
    threshold: number;
    probateTotal: number;
    isEligibleForSmallEstate: boolean;
    reason: string;
    legalTerm?: string;
    citations?: string[];
    modifiers?: string[]; // e.g. "INSOLVENT", "MINOR_HEIRS"
}

export function getMasterMode(type: AuthorityType): MasterMode {
    switch (type) {
        case "FORMAL_PROBATE":
        case "INFORMAL_PROBATE":
        case "SUMMARY_ADMINISTRATION":
        case "VOLUNTARY_ADMINISTRATION":
        case "MUNIMENT_OF_TITLE":
        case "ANCILLARY_PROBATE":
        case "SPOUSAL_PETITION":
        case "ELECTIVE_SHARE":
        case "FAMILY_ALLOWANCE":
        case "INTESTATE":
        case "CONTESTED_ESTATE":
        case "DISCOVERY":
            return "COURT_SUPERVISED";

        case "TRUST_ADMIN_REVOCABLE":
        case "TRUST_ADMIN_IRREVOCABLE":
        case "POUR_OVER_WILL":
        case "INSOLVENT_ESTATE":
        case "BUSINESS_ESTATE":
            return "FIDUCIARY_ADMINISTERED";

        case "SMALL_ESTATE": // Often affidavit-only
        case "JOINT_TRANSFER":
        case "POD_TOD_TRANSFER":
        case "BENEFICIARY_DESIGNATED":
        case "TOD_DEED":
        case "UNCLAIMED_ESTATE":
            return "TRANSFER_ONLY";

        default:
            return "COURT_SUPERVISED";
    }
}

export function calculateAuthorityRecommendation(
    assets: any[],
    state: string,
    metadata?: {
        hasWill?: boolean;
        isSpouse?: boolean;
        isOutOfState?: boolean;
        estimatedValue?: number;
        isTrustRevocable?: boolean;
        hasMinors?: boolean;
        hasInsolvencyRisk?: boolean;
        hasBusiness?: boolean;
        hasContest?: boolean; // PTH-06
        hasUnclaimedProperty?: boolean; // PTH-18
        hasTODDeed?: boolean; // PTH-17
        hasElectiveShare?: boolean; // PTH-20
    }
): AuthorityRecommendation {
    const threshold = STATE_THRESHOLDS[state] || 50000;

    const probateAssets = assets.filter(a => a.ownershipType === "INDIVIDUAL");
    let probateTotal = probateAssets.reduce((sum, a) => sum + (a.value || 0), 0);

    // Fallback to estimatedValue if provided and no probate assets exist
    if (probateTotal === 0 && metadata?.estimatedValue) {
        probateTotal = metadata.estimatedValue;
    }

    const trustAssets = assets.filter(a => a.ownershipType === "TRUST");
    const jointAssets = assets.filter(a => a.ownershipType === "JOINT");
    const beneficiaryAssets = assets.filter(a => a.ownershipType === "BENEFICIARY");

    const isEligibleForSmallEstate = probateTotal > 0 && probateTotal <= threshold;

    let type: AuthorityType = "UNSET";
    let reason = "";
    let legalTerm = "";
    let citations: string[] = [];
    let modifiers: string[] = [];

    // Modifiers detection
    if (metadata?.hasInsolvencyRisk) modifiers.push("INSOLVENT");
    if (metadata?.hasMinors) modifiers.push("MINOR_HEIRS");
    if (metadata?.hasBusiness || assets.some(a => a.assetType === "BUSINESS" || a.category === "business")) {
        modifiers.push("BUSINESS_ESTATE");
    }
    if (metadata?.hasContest) modifiers.push("CONTESTED");
    if (metadata?.hasUnclaimedProperty) modifiers.push("UNCLAIMED_PROPERTY");
    if (metadata?.hasElectiveShare) modifiers.push("ELECTIVE_SHARE");

    // Check for modifiers first
    if (trustAssets.length > 0 && probateTotal > 0) {
        type = "POUR_OVER_WILL";
        reason = "Estate involves both Trust assets and Probate assets. A Pour-Over Will likely bridges them.";
        legalTerm = "Hybrid Administration (Trust + Probate)";
        citations = ["CA Prob. Code §6300", "Uniform Probate Code §2-511"];
    } else if (metadata?.isOutOfState) {
        type = "ANCILLARY_PROBATE";
        reason = "Property located in another state requires Ancillary Probate.";
        legalTerm = "Ancillary Administration";
        citations = ["CA Prob. Code §12501", "Uniform Probate Code §IV"];
    } else if (metadata?.isSpouse && probateTotal > 0) {
        type = "SPOUSAL_PETITION";
        reason = "As a surviving spouse, you may be eligible for a Spousal Property Petition, which is faster than full probate.";
        legalTerm = state === "CA" ? "DE-221 Spousal Property Petition" : "Spousal Set-Aside";
        citations = state === "CA" ? ["CA Prob. Code §13500"] : ["State Spousal Set-Aside Statute"];
    } else if (probateTotal === 0 && trustAssets.length > 0) {
        type = metadata?.isTrustRevocable === false ? "TRUST_ADMIN_IRREVOCABLE" : "TRUST_ADMIN_REVOCABLE";
        reason = `Assets are held in a ${type === "TRUST_ADMIN_IRREVOCABLE" ? "Irrevocable" : "Revocable"} Trust. No court probate required.`;
        legalTerm = "Trust Administration";
        citations = ["Uniform Trust Code", "State Trust Statute"];
    } else if (metadata?.hasTODDeed) {
        type = "TOD_DEED";
        reason = "A Transfer-on-Death (TOD) Deed exists for the primary real property, bypassing probate.";
        legalTerm = "TOD Deed Transfer";
        citations = ["CA Prob. Code §5600", "State TOD Deed Statutes"];
    } else if (probateAssets.length === 0) {
        if (jointAssets.length > 0) {
            type = "JOINT_TRANSFER";
            reason = "Assets pass automatically to the surviving joint owner.";
        } else if (beneficiaryAssets.length > 0) {
            type = "BENEFICIARY_DESIGNATED";
            reason = "Assets pass directly to named beneficiaries.";
        } else {
            type = "POD_TOD_TRANSFER";
            reason = "Assets pass directly via POD/TOD designations.";
        }
        legalTerm = "Non-Probate Transfer";
        citations = ["Right of Survivorship Laws"];
    } else if (isEligibleForSmallEstate) {
        if (state === "FL") {
            type = "SUMMARY_ADMINISTRATION";
            reason = `Florida Summary Administration is available for estates under $75,000.`;
            legalTerm = "FL Statute 735.201 Summary Administration";
            citations = ["FL Stat. §735.201"];
        } else if (state === "NY") {
            type = "VOLUNTARY_ADMINISTRATION";
            reason = `New York Voluntary Administration is available for estates under $50,000.`;
            legalTerm = "NY SCPA Article 13 Small Estate";
            citations = ["NY SCPA Article 13"];
        } else if (state === "TX") {
            type = "SMALL_ESTATE";
            reason = `Texas Small Estate Affidavit is available for estates under $75,000 without a complex will.`;
            legalTerm = "TX Estates Code 205 Small Estate Affidavit";
            citations = ["TX Estates Code §205"];
        } else {
            type = "SMALL_ESTATE";
            reason = `Probate assets ($${probateTotal.toLocaleString()}) are below the ${state} threshold. You can likely use a Small Estate Affidavit.`;
            legalTerm = state === "CA" ? "CA Prob. Code 13100 Affidavit" : "Small Estate Affidavit";
            citations = state === "CA" ? ["CA Prob. Code §13100"] : ["Uniform Probate Code §III"];
        }
    } else {
        // Check for Informal Probate (UPC states only)
        if (UPC_STATES.includes(state) && metadata?.hasWill && !metadata?.hasContest) {
            type = "INFORMAL_PROBATE";
            reason = `${state} follows the Uniform Probate Code. Informal probate is available for uncontested estates with a valid will, offering a streamlined process without formal hearings.`;
            legalTerm = "Informal Probate (UPC)";
            citations = ["Uniform Probate Code §3-301", `${state} UPC Adoption Statute`];
        } else {
            type = metadata?.hasWill === false ? "INTESTATE" : "FORMAL_PROBATE";

            // Texas Muniment of Title Check
            if (state === "TX" && metadata?.hasWill && !metadata?.hasInsolvencyRisk) {
                type = "MUNIMENT_OF_TITLE";
                reason = "Texas allows admitting a Will to probate as a 'Muniment of Title' when no executor administration is needed and the estate is not insolvent.";
                legalTerm = "Muniment of Title";
                citations = ["TX Estates Code §257"];
            }

            const stateTerm = state === "NY" ? "Formal Administration" : state === "FL" ? "Formal Administration" : "Formal Probate";

            if (type !== "MUNIMENT_OF_TITLE" && type !== "INFORMAL_PROBATE") {
                reason = metadata?.hasWill === false
                    ? `No Will found and assets exceed the ${state} threshold. Formal Intestate Succession is required.`
                    : `Assets exceed the ${state} threshold ($${threshold.toLocaleString()}). ${stateTerm} is required.`;
                legalTerm = metadata?.hasWill === false ? "Intestate Administration" : stateTerm;
                citations = state === "CA" ? ["CA Prob. Code §7000"] : ["Uniform Probate Code §III"];
            }
        }
    }

    return {
        type,
        masterMode: getMasterMode(type),
        threshold,
        probateTotal,
        isEligibleForSmallEstate,
        reason,
        legalTerm,
        citations,
        modifiers
    };
}

// Institution-specific authority requirements
export type InstitutionAuthorityRequirement = "AFFIDAVIT_ACCEPTED" | "LETTERS_PREFERRED" | "LETTERS_REQUIRED" | "BENEFICIARY_ONLY" | "VARIES";

export interface InstitutionAuthorityRule {
    requirement: InstitutionAuthorityRequirement;
    conditions?: string[];
    warning?: string;
}

export function getInstitutionAuthorityRequirement(
    assetType: string,
    category: string,
    value: number,
    ownershipType: string
): InstitutionAuthorityRule {
    // Beneficiary-designated accounts bypass probate entirely
    if (ownershipType === "BENEFICIARY" || ownershipType === "JOINT") {
        return {
            requirement: "BENEFICIARY_ONLY",
            conditions: ["Named beneficiary exists", "Death certificate required"],
        };
    }

    // Real Estate almost always requires Letters
    if (category === "real_estate" || assetType === "REAL_ESTATE") {
        return {
            requirement: "LETTERS_REQUIRED",
            conditions: ["Title transfer", "Selling property", "Clearing liens"],
            warning: "Real estate transactions require court-issued Letters Testamentary in most states."
        };
    }

    // Retirement accounts (if estate is beneficiary)
    if (assetType === "RETIREMENT" || assetType === "IRA" || assetType === "401K") {
        if (ownershipType === "INDIVIDUAL") {
            return {
                requirement: "LETTERS_REQUIRED",
                conditions: ["Estate is named beneficiary", "No valid beneficiary designation"],
                warning: "Retirement accounts require Letters when the estate is the beneficiary."
            };
        }
        return {
            requirement: "BENEFICIARY_ONLY",
            conditions: ["Direct beneficiary claim"],
        };
    }

    // Life Insurance
    if (assetType === "LIFE_INSURANCE") {
        if (ownershipType === "INDIVIDUAL") {
            return {
                requirement: "LETTERS_REQUIRED",
                conditions: ["Estate is beneficiary"],
            };
        }
        return {
            requirement: "BENEFICIARY_ONLY",
            conditions: ["Paid directly to beneficiary"],
        };
    }

    // Banks - threshold-based
    if (category === "financial" && (assetType === "CHECKING" || assetType === "SAVINGS" || assetType === "CD")) {
        if (value > 50000) {
            return {
                requirement: "LETTERS_PREFERRED",
                conditions: ["Large balance", "Bank may require Letters even if affidavit is legally valid"],
                warning: "Banks often require Letters Testamentary for balances over $50,000, even when state law allows affidavits."
            };
        }
        return {
            requirement: "AFFIDAVIT_ACCEPTED",
            conditions: ["Small balance", "Estate under state threshold", "Waiting period satisfied"],
        };
    }

    // Brokerage - usually requires Letters
    if (category === "financial" && (assetType === "BROKERAGE" || assetType === "INVESTMENT")) {
        if (value < 25000) {
            return {
                requirement: "VARIES",
                conditions: ["Small account may accept affidavit", "Most brokerages prefer Letters"],
                warning: "Major brokerages typically require Letters Testamentary even for small accounts."
            };
        }
        return {
            requirement: "LETTERS_REQUIRED",
            conditions: ["High-value portfolio", "Complex holdings", "Re-registration required"],
            warning: "Brokerage firms almost always require court-issued Letters Testamentary."
        };
    }

    // Default: varies by institution
    return {
        requirement: "VARIES",
        conditions: ["Contact institution for specific requirements"],
        warning: "Authority requirements vary by institution. Start with Small Estate Affidavit if eligible, escalate to Letters if rejected."
    };
}
