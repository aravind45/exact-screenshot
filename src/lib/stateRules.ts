export type AuthoritySource =
    | "COURT"                // Powers granted by judge (Letters, Orders)
    | "FIDUCIARY_INSTRUMENT" // Powers granted by Will/Trust document
    | "BENEFICIARY_TRANSFER" // Powers granted by TOD/POD/Designation laws
    | "UNSET";

export type ProcedureType =
    | "FORMAL_PROBATE"
    | "INFORMAL_PROBATE"
    | "SUMMARY_ADMINISTRATION"
    | "VOLUNTARY_ADMINISTRATION"
    | "MUNIMENT_OF_TITLE"
    | "SMALL_ESTATE_AFFIDAVIT"
    | "ANCILLARY_PROBATE"
    | "SPOUSAL_PETITION"
    | "TRUST_ADMINISTRATION"
    | "DIRECT_TRANSFER"     // TOD/POD/Joint
    | "DISCOVERY"
    | "UNSET";

export type DistributionModel =
    | "TESTATE"             // Per Will
    | "INTESTATE"           // Per State Law
    | "POUR_OVER"           // Will to Trust
    | "TRUST_TERMS"         // Per Trust document
    | "DIRECT_BENEFICIARY"  // Per designation
    | "UNSET";

// Legacy Type for backward compatibility during transition
export type AuthorityType =
    | "FORMAL_PROBATE"
    | "INFORMAL_PROBATE"
    | "SMALL_ESTATE"
    | "SUMMARY_ADMINISTRATION"
    | "VOLUNTARY_ADMINISTRATION"
    | "MUNIMENT_OF_TITLE"
    | "ANCILLARY_PROBATE"
    | "SPOUSAL_PETITION"
    | "ELECTIVE_SHARE"
    | "FAMILY_ALLOWANCE"
    | "TRUST_ADMIN_REVOCABLE"
    | "TRUST_ADMIN_IRREVOCABLE"
    | "POUR_OVER_WILL"
    | "JOINT_TRANSFER"
    | "POD_TOD_TRANSFER"
    | "BENEFICIARY_DESIGNATED"
    | "TOD_DEED"
    | "INTESTATE"
    | "INSOLVENT_ESTATE"
    | "ESTATE_WITH_MINORS"
    | "BUSINESS_ESTATE"
    | "CONTESTED_ESTATE"
    | "UNCLAIMED_ESTATE"
    | "DISCOVERY"
    | "UNSET";

export interface StateRule {
    threshold: number;
    smallEstateTerm: string;
    smallEstateCitation: string[];
    probateTerm: string;
    probateCitation: string[];
    isUPC: boolean;
    spousalSetAside?: {
        term: string;
        citation: string[];
    };
    notes?: string;
}

export const STATE_RULES: Record<string, StateRule> = {
    "CA": {
        threshold: 184500,
        smallEstateTerm: "CA Prob. Code 13100 Affidavit",
        smallEstateCitation: ["CA Prob. Code §13100"],
        probateTerm: "Formal Probate",
        probateCitation: ["CA Prob. Code §7000"],
        isUPC: false,
        spousalSetAside: {
            term: "DE-221 Spousal Property Petition",
            citation: ["CA Prob. Code §13500"]
        }
    },
    "FL": {
        threshold: 75000,
        smallEstateTerm: "Summary Administration",
        smallEstateCitation: ["FL Stat. §735.201"],
        probateTerm: "Formal Administration",
        probateCitation: ["FL Stat. §733"],
        isUPC: false,
        spousalSetAside: {
            term: "Spousal Set-Aside",
            citation: ["FL Stat. §732.401"]
        }
    },
    "TX": {
        threshold: 75000,
        smallEstateTerm: "Small Estate Affidavit",
        smallEstateCitation: ["TX Estates Code §205"],
        probateTerm: "Independent Administration",
        probateCitation: ["TX Estates Code §401"],
        isUPC: false,
        notes: "Supports Muniment of Title for uncontested wills."
    },
    "NY": {
        threshold: 50000,
        smallEstateTerm: "Voluntary Administration",
        smallEstateCitation: ["NY SCPA Article 13"],
        probateTerm: "Formal Administration",
        probateCitation: ["NY SCPA Article 14"],
        isUPC: false
    },
    "IL": {
        threshold: 100000,
        smallEstateTerm: "Small Estate Affidavit",
        smallEstateCitation: ["755 ILCS 5/25-1"],
        probateTerm: "Formal Probate",
        probateCitation: ["755 ILCS 5/"],
        isUPC: false
    },
    "PA": {
        threshold: 50000,
        smallEstateTerm: "Settlement of Small Estates",
        smallEstateCitation: ["20 Pa. C.S. § 3102"],
        probateTerm: "Formal Probate",
        probateCitation: ["20 Pa. C.S. § 3131"],
        isUPC: false
    }
};

// Default rule for unknown states or those following basic UPC patterns
export const DEFAULT_STATE_RULE: StateRule = {
    threshold: 50000,
    smallEstateTerm: "Small Estate Affidavit",
    smallEstateCitation: ["State Small Estate Statute"],
    probateTerm: "Formal Probate",
    probateCitation: ["State Probate Code"],
    isUPC: false
};

// UPC States Mapping
export const UPC_STATES = [
    "AK", "AZ", "CO", "HI", "ID", "ME", "MI", "MN", "MT",
    "NE", "NM", "ND", "SC", "SD", "UT"
];

// Initialize UPC states in the rules dictionary if not explicitly defined
UPC_STATES.forEach(state => {
    if (!STATE_RULES[state]) {
        STATE_RULES[state] = {
            ...DEFAULT_STATE_RULE,
            isUPC: true,
            smallEstateCitation: ["Uniform Probate Code §III"],
            probateCitation: ["Uniform Probate Code §III"]
        };
    } else {
        STATE_RULES[state].isUPC = true;
    }
});

export function getStateRule(state: string): StateRule {
    return STATE_RULES[state] || DEFAULT_STATE_RULE;
}
