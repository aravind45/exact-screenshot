
import {
    getStateRule,
    UPC_STATES,
    STATE_RULES,
    type AuthorityType,
    type AuthoritySource,
    type ProcedureType,
    type DistributionModel
} from './stateRules.js';
export { UPC_STATES, type AuthorityType, getStateRule };

export type AssetAuthorityType =
    | 'COURT_REQUIRED'
    | 'TRUSTEE_DIRECT'
    | 'AFFIDAVIT_SMALL'
    | 'BENEFICIARY_CONTRACT'
    | 'SURVIVORSHIP_TITLE'
    | 'LITIGATION_HOLD'
    | 'UNSET';

/**
 * Maps asset titling (ownershipType) to UI authority categories
 */
export function getAssetAuthorityType(
    asset: { ownershipType: string; value: number; beneficiaryDesignation?: string; inTrust?: boolean; todDeedRecorded?: boolean },
    threshold: number
): AssetAuthorityType {
    const { ownershipType, value, beneficiaryDesignation, inTrust, todDeedRecorded } = asset;

    // Direct transfers bypass everything else
    if (ownershipType === 'BENEFICIARY' || beneficiaryDesignation) return 'BENEFICIARY_CONTRACT';
    if (ownershipType === 'JOINT') return 'SURVIVORSHIP_TITLE';
    if (todDeedRecorded) return 'BENEFICIARY_CONTRACT'; // TOD Deeds are beneficiary-like

    // Trusts
    if (ownershipType === 'TRUST' || inTrust) return 'TRUSTEE_DIRECT';

    // Probate vs Affidavit
    if (ownershipType === 'INDIVIDUAL') {
        return value > threshold ? 'COURT_REQUIRED' : 'AFFIDAVIT_SMALL';
    }

    return 'UNSET';
}

// State thresholds for small estate eligibility
export const STATE_THRESHOLDS: Record<string, number> = Object.fromEntries(
    Object.entries(STATE_RULES).map(([state, rule]) => [state, rule.threshold])
);

export type MasterMode =
    | "COURT_SUPERVISED"
    | "FIDUCIARY_ADMINISTERED"
    | "TRANSFER_ONLY";

export interface AuthorityRecommendation {
    // Primary classification
    type: AuthorityType;
    masterMode: MasterMode;

    // Multi-dimensional classification (Attorney Model)
    authoritySource: AuthoritySource;
    procedureType: ProcedureType;
    distributionModel: DistributionModel;
    activeEngines: ("PROBATE" | "TRUST" | "TOD_DEED" | "POD_TOD_ACCOUNTS" | "DISCOVERY" | "NON_PROBATE" | "AFFIDAVIT")[];

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
        case "BUSINESS_ESTATE":
            return "FIDUCIARY_ADMINISTERED";

        // INSOLVENT_ESTATE requires court supervision for creditor priority ordering —
        // NOT fiduciary-only. Moving here ensures correct task filtering in roadmap.
        case "INSOLVENT_ESTATE":
            return "COURT_SUPERVISED";

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
    const rule = getStateRule(state);
    const threshold = rule.threshold;

    // 1. ASSET-FIRST CLASSIFICATION (Mandatory)
    const probateAssets = assets.filter(a =>
        a.ownershipType === "INDIVIDUAL" &&
        !a.beneficiaryDesignation &&
        !a.todDeedRecorded &&
        !a.inTrust
    );
    let probateTotal = probateAssets.reduce((sum, a) => sum + (a.value || 0), 0);

    // Fallback if no specific assets entered yet
    if (probateTotal === 0 && metadata?.estimatedValue && !metadata?.hasTODDeed && !metadata?.isTrustRevocable) {
        probateTotal = metadata.estimatedValue;
    }
    // Guardrail: if probate-eligible assets exist but values are missing/zero,
    // treat as probate-present to avoid trust-first bias.
    if (probateTotal === 0 && probateAssets.length > 0) {
        probateTotal = 1;
    }

    const trustAssets = assets.filter(a => a.ownershipType === "TRUST" || a.inTrust);
    const beneficiaryAssets = assets.filter(a =>
        a.ownershipType === "BENEFICIARY" ||
        a.beneficiaryDesignation ||
        a.todDeedRecorded ||
        a.ownershipType === "JOINT"
    );

    // 2. INITIALIZE TRACKS
    let type: AuthorityType = "UNSET";
    let authoritySource: AuthoritySource = "UNSET";
    let procedureType: ProcedureType = "UNSET";
    let distributionModel: DistributionModel = "UNSET";
    let activeEngines: ("PROBATE" | "TRUST" | "TOD_DEED" | "POD_TOD_ACCOUNTS" | "DISCOVERY" | "NON_PROBATE" | "AFFIDAVIT")[] = [];
    let modifiers: string[] = [];

    const isEligibleForSmallEstate = probateTotal > 0 && probateTotal <= threshold;

    // Modifiers detection
    if (metadata?.hasInsolvencyRisk) modifiers.push("INSOLVENT");
    if (metadata?.hasMinors) modifiers.push("MINOR_HEIRS");
    if (metadata?.hasBusiness || assets.some(a => a.assetType === "BUSINESS" || a.category === "business")) {
        modifiers.push("BUSINESS_ESTATE");
    }
    if (metadata?.hasContest) modifiers.push("CONTESTED");

    // 3. ENGINE ACTIVATION
    if (metadata?.hasTODDeed || assets.some(a => a.todDeedRecorded)) {
        activeEngines.push("TOD_DEED");
        activeEngines.push("NON_PROBATE");
    }
    if (beneficiaryAssets.length > 0) {
        activeEngines.push("POD_TOD_ACCOUNTS");
        if (!activeEngines.includes("NON_PROBATE")) activeEngines.push("NON_PROBATE");
    }
    if (trustAssets.length > 0 || metadata?.isTrustRevocable !== undefined) {
        activeEngines.push("TRUST");
    }
    if (probateTotal > 0 || metadata?.isOutOfState) {
        activeEngines.push("PROBATE");
        if (isEligibleForSmallEstate) activeEngines.push("AFFIDAVIT");
    } else if (metadata?.isSpouse && !activeEngines.includes("TRUST") && !activeEngines.includes("TOD_DEED")) {
        // Spousal petition as a fallback for probate assets only if no trust/TOD simplifies the path
        activeEngines.push("PROBATE");
    }
    if (activeEngines.length === 0) {
        activeEngines.push("DISCOVERY");
        if (type === "UNSET") type = "DISCOVERY";
        if (procedureType === "UNSET") procedureType = "DISCOVERY";
    }

    // 4. MULTI-DIMENSIONAL CLASSIFICATION (Attorney Decision Tree)

    // AUTHORITY SOURCE
    if (probateTotal > threshold || metadata?.isOutOfState || metadata?.hasContest) {
        authoritySource = "COURT";
    } else if (trustAssets.length > 0) {
        authoritySource = "FIDUCIARY_INSTRUMENT";
    } else {
        authoritySource = "BENEFICIARY_TRANSFER";
    }

    // PROCEDURE TYPE DETERMINATION
    // Hierarchy follows Estate_Path_Combinations_All_50_States.xlsx priority:
    //   1. Insolvency (debt wins — overrides everything except trust in some states)
    //   2. Trust type (bypasses probate regardless of will/out-of-state)
    //   3. Contested (litigation overrides ancillary)
    //   4. Ancillary Probate (out-of-state BEFORE will=no check — intestate + out-of-state = ancillary)
    //   5. Intestate (will=no, not contested, not out-of-state)
    //   6. Spousal petition
    //   7. General probate (will=yes or large estate)
    if (metadata?.hasInsolvencyRisk) {
        // Insolvent estate requires court-supervised creditor priority process
        procedureType = "FORMAL_PROBATE";
        type = "INSOLVENT_ESTATE";
    } else if (metadata?.hasContest) {
        // Contested estates require formal probate regardless of out-of-state or will status
        procedureType = "FORMAL_PROBATE";
        type = "CONTESTED_ESTATE";
    } else if (metadata?.isOutOfState) {
        procedureType = "ANCILLARY_PROBATE";
        type = metadata?.hasWill ? "FORMAL_PROBATE" : "INTESTATE";
    } else if (metadata?.isSpouse) {
        procedureType = "SPOUSAL_PETITION";
        type = "SPOUSAL_PETITION";
    } else if (metadata?.hasWill) {
        if (state === "MA") {
            // MA-specific: Use Informal Probate for uncontested estates, Formal for contested
            if (metadata?.hasContest) {
                procedureType = "FORMAL_PROBATE";
                type = "FORMAL_PROBATE";
            } else {
                procedureType = "INFORMAL_PROBATE";
                type = "INFORMAL_PROBATE";
            }
        } else if (state === "TX" && !metadata?.hasInsolvencyRisk) {
            // TX-specific: Muniment of Title for uncontested wills with no unpaid debts (except secured)
            // Independent Administration is the default for TX wills
            if (probateTotal <= threshold) {
                procedureType = "MUNIMENT_OF_TITLE";
                type = "MUNIMENT_OF_TITLE";
            } else {
                // Large TX estates with will → Independent Administration (still formal, but TX-unique)
                procedureType = "FORMAL_PROBATE";
                type = "FORMAL_PROBATE";
            }
        } else if (rule.isUPC) {
            procedureType = "INFORMAL_PROBATE";
            type = "INFORMAL_PROBATE";
        } else {
            procedureType = "FORMAL_PROBATE";
            type = "FORMAL_PROBATE";
        }
    } else if (probateTotal > threshold) {
        type = "INTESTATE";
        if (rule.isUPC) {
            procedureType = "INFORMAL_PROBATE";
        } else {
            procedureType = "FORMAL_PROBATE";
        }
    } else if (isEligibleForSmallEstate) {
        if (state === "MA" && probateTotal <= 25000) procedureType = "VOLUNTARY_ADMINISTRATION";
        else if (state === "FL" && probateTotal < 75000) procedureType = "SUMMARY_ADMINISTRATION";
        else if (state === "NY" && probateTotal < 50000) procedureType = "VOLUNTARY_ADMINISTRATION";
        else if (state === "GA" && probateTotal <= 10000) procedureType = "SMALL_ESTATE_AFFIDAVIT"; // "No Administration Necessary"
        else procedureType = "SMALL_ESTATE_AFFIDAVIT";
        type = "SMALL_ESTATE";
    } else if (activeEngines.includes("TOD_DEED") || activeEngines.includes("POD_TOD_ACCOUNTS")) {
        procedureType = "DIRECT_TRANSFER";
        type = metadata?.hasTODDeed ? "TOD_DEED" : "POD_TOD_TRANSFER";
    } else if (trustAssets.length > 0) {
        procedureType = "TRUST_ADMINISTRATION";
        type = metadata?.isTrustRevocable ? "TRUST_ADMIN_REVOCABLE" : "TRUST_ADMIN_IRREVOCABLE";
    }

    // DISTRIBUTION MODEL
    if (metadata?.hasWill && trustAssets.length > 0 && probateTotal > 0) {
        distributionModel = "POUR_OVER";
    } else if (metadata?.hasWill) {
        distributionModel = "TESTATE";
    } else if (trustAssets.length > 0) {
        distributionModel = "TRUST_TERMS";
    } else if (probateTotal > 0) {
        distributionModel = "INTESTATE";
    } else {
        distributionModel = "DIRECT_BENEFICIARY";
    }

    // Backwards Compatibility Mapping for UI strings
    let legalTerm = procedureType.replace(/_/g, " ");
    let citations = rule.probateCitation;
    let reason = `Multi-track active: ${activeEngines.join(", ")}. Primary Source: ${authoritySource}.`;

    return {
        type,
        masterMode: getMasterMode(type),
        authoritySource,
        procedureType,
        distributionModel,
        activeEngines,
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

/**
 * Check if the estate profile has enough data for the engine
 */
export function isProfileComplete(estate: any): boolean {
    if (!estate) return false;

    // Only require the essential identity fields needed to identify the estate.
    // authorityType (the settlement track) is NOT required here — the entire
    // app functions with UNSET authority using sensible defaults. Requiring it
    // caused an endless redirect loop for users who skipped the Track Scout step.
    const hasCriticalFields = !!(
        estate.deceasedFirstName?.trim() &&
        estate.deceasedLastName?.trim() &&
        estate.deceasedState?.trim()
    );

    return hasCriticalFields;
}
