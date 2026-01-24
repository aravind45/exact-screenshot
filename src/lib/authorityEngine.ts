
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
