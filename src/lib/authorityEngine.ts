
export const STATE_THRESHOLDS: Record<string, number> = {
    "CA": 184500,
    "NY": 50000,
    "TX": 75000,
    "FL": 75000,
    "IL": 100000,
    "PA": 50000,
};

export type AuthorityType = "PROBATE" | "SMALL_ESTATE" | "NON_PROBATE" | "UNSET";

export interface AuthorityRecommendation {
    type: AuthorityType;
    threshold: number;
    probateTotal: number;
    isEligibleForSmallEstate: boolean;
    reason: string;
}

export function calculateAuthorityRecommendation(
    assets: any[],
    state: string
): AuthorityRecommendation {
    const threshold = STATE_THRESHOLDS[state] || 50000; // Default to $50k if unknown

    // Probate assets are those owned INDIVIDUALLY (no trust, joint, or beneficiary override)
    const probateAssets = assets.filter(a => a.ownershipType === "INDIVIDUAL");
    const probateTotal = probateAssets.reduce((sum, a) => sum + (a.value || 0), 0);

    const isEligibleForSmallEstate = probateTotal > 0 && probateTotal <= threshold;

    let type: AuthorityType = "UNSET";
    let reason = "";

    if (assets.length === 0) {
        type = "UNSET";
        reason = "Add assets to determine the required legal path.";
    } else if (probateAssets.length === 0) {
        type = "NON_PROBATE";
        reason = "All assets appear to have beneficiary designations or joint ownership. No court authority may be required.";
    } else if (isEligibleForSmallEstate) {
        type = "SMALL_ESTATE";
        reason = `Probate assets ($${probateTotal.toLocaleString()}) are below the ${state} threshold of $${threshold.toLocaleString()}. You can likely use a Small Estate Affidavit.`;
    } else {
        type = "PROBATE";
        reason = `Probate assets ($${probateTotal.toLocaleString()}) exceed the ${state} threshold of $${threshold.toLocaleString()}. Formal Probate and Letters Testamentary are likely required.`;
    }

    return {
        type,
        threshold,
        probateTotal,
        isEligibleForSmallEstate,
        reason
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
