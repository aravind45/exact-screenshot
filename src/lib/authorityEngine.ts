
export const STATE_THRESHOLDS: Record<string, number> = {
    "CA": 184500,
    "NY": 50000,
    "TX": 75000,
    "FL": 75000,
    "IL": 100000,
    "PA": 50000,
};

export type AuthorityType =
    | "FORMAL_PROBATE"
    | "INFORMAL_PROBATE"
    | "SMALL_ESTATE"
    | "SUMMARY_ADMINISTRATION" // Florida specific
    | "VOLUNTARY_ADMINISTRATION" // New York specific
    | "TRUST_ADMIN"
    | "INTESTATE"
    | "JOINT_TRANSFER"
    | "POD_TOD_TRANSFER"
    | "SPOUSAL_PETITION"
    | "ANCILLARY_PROBATE"
    | "UNSET";

export interface AuthorityRecommendation {
    type: AuthorityType;
    threshold: number;
    probateTotal: number;
    isEligibleForSmallEstate: boolean;
    reason: string;
    legalTerm?: string;
    citations?: string[];
}

export function calculateAuthorityRecommendation(
    assets: any[],
    state: string,
    metadata?: {
        hasWill?: boolean;
        isSpouse?: boolean;
        isOutOfState?: boolean;
        estimatedValue?: number;
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

    const isEligibleForSmallEstate = probateTotal > 0 && probateTotal <= threshold;

    let type: AuthorityType = "UNSET";
    let reason = "";
    let legalTerm = "";
    let citations: string[] = [];

    if (metadata?.isOutOfState) {
        type = "ANCILLARY_PROBATE";
        reason = "Property located in another state requires Ancillary Probate.";
        legalTerm = "Ancillary Administration";
        citations = ["CA Prob. Code §12501", "Uniform Probate Code §IV"];
    } else if (metadata?.isSpouse && probateTotal > 0) {
        type = "SPOUSAL_PETITION";
        reason = "As a surviving spouse, you may be eligible for a Spousal Property Petition, which is faster than full probate.";
        legalTerm = state === "CA" ? "DE-221 Spousal Property Petition" : "Spousal Set-Aside";
        citations = state === "CA" ? ["CA Prob. Code §13500"] : ["State Spousal Set-Aside Statute"];
    } else if (probateAssets.length === 0 && trustAssets.length > 0) {
        type = "TRUST_ADMIN";
        reason = "Assets are held in Trust. No court probate required; proceed with Trust Administration.";
        legalTerm = "Trust Administration";
        citations = ["Uniform Trust Code", "State Trust Statute"];
    } else if (probateAssets.length === 0) {
        const hasJoint = assets.some(a => a.ownershipType === "JOINT");
        type = hasJoint ? "JOINT_TRANSFER" : "POD_TOD_TRANSFER";
        reason = hasJoint
            ? "Assets pass automatically to the surviving joint owner."
            : "Assets pass directly to named beneficiaries via POD/TOD designations.";
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
        type = metadata?.hasWill === false ? "INTESTATE" : "FORMAL_PROBATE";
        const stateTerm = state === "NY" ? "Formal Administration" : state === "FL" ? "Formal Administration" : "Formal Probate";

        reason = metadata?.hasWill === false
            ? `No Will found and assets exceed the ${state} threshold. Formal Intestate Succession is required.`
            : `Assets exceed the ${state} threshold ($${threshold.toLocaleString()}). ${stateTerm} is required.`;
        legalTerm = metadata?.hasWill === false ? "Intestate Administration" : stateTerm;
        citations = state === "CA" ? ["CA Prob. Code §7000"] : ["Uniform Probate Code §III"];
    }

    return {
        type,
        threshold,
        probateTotal,
        isEligibleForSmallEstate,
        reason,
        legalTerm,
        citations
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
