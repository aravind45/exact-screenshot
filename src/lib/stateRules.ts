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
    lettersTerm: string;
    spousalSetAside?: {
        term: string;
        citation: string[];
    };
    notes?: string;
    // MUPC / Dynamic Logic Fields
    probateSystem?: "MUPC" | "GENERIC";
    claimWindowDays?: number;
    shortenedWindowDays?: number;
    estateTaxThreshold?: number;
    bondDefaultRequired?: boolean;
}

export const STATE_RULES: Record<string, StateRule> = {
    "AL": { threshold: 30000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Ala. Code § 43-2-690"], probateTerm: "Formal Probate", probateCitation: ["Ala. Code § 43-2"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "AK": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Alaska Stat. § 13.16.680"], probateTerm: "Formal Probate", probateCitation: ["Alaska Stat. § 13.16"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "AZ": { threshold: 200000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["A.R.S. § 14-3971"], probateTerm: "Informal Probate", probateCitation: ["A.R.S. § 14-3301"], isUPC: true, lettersTerm: "Letters Testamentary", notes: "Threshold increased to $200k for personal property in 2025." },
    "AR": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Ark. Code § 28-41-101"], probateTerm: "Formal Probate", probateCitation: ["Ark. Code § 28-40"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "CA": {
        threshold: 208850,
        smallEstateTerm: "CA Prob. Code 13100 Affidavit",
        smallEstateCitation: ["CA Prob. Code §13100"],
        probateTerm: "Formal Probate",
        probateCitation: ["CA Prob. Code §7000"],
        isUPC: false,
        lettersTerm: "Letters of Authority",
        spousalSetAside: {
            term: "Spousal Property Order",
            citation: ["CA Prob. Code §13500"]
        },
        notes: "Updated 2025/2026 threshold is $208,850."
    },
    "CO": { threshold: 82000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["C.R.S. § 15-12-1201"], probateTerm: "Informal Probate", probateCitation: ["C.R.S. § 15-12-301"], isUPC: true, lettersTerm: "Letters Testamentary", notes: "Threshold adjusted annually for inflation ($82k for 2024/25)." },
    "CT": { threshold: 40000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Conn. Gen. Stat. § 45a-273"], probateTerm: "Formal Probate", probateCitation: ["Conn. Gen. Stat. § 45a"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "DE": { threshold: 30000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["12 Del. C. § 2306"], probateTerm: "Formal Probate", probateCitation: ["12 Del. C. § 23"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "DC": { threshold: 40000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["D.C. Code § 20-351"], probateTerm: "Formal Probate", probateCitation: ["D.C. Code § 20"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "FL": {
        threshold: 75000,
        smallEstateTerm: "Summary Administration",
        smallEstateCitation: ["FL Stat. §735.201"],
        probateTerm: "Formal Administration",
        probateCitation: ["FL Stat. §733"],
        isUPC: false,
        lettersTerm: "Letters of Administration",
        spousalSetAside: {
            term: "Spousal Set-Aside",
            citation: ["FL Stat. §732.401"]
        }
    },
    "GA": { threshold: 10000, smallEstateTerm: "No Administration Necessary", smallEstateCitation: ["O.C.G.A. § 53-2-40"], probateTerm: "Formal Probate", probateCitation: ["O.C.G.A. § 53-7"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "HI": { threshold: 100000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["H.R.S. § 560:3-1201"], probateTerm: "Informal Probate", probateCitation: ["H.R.S. § 560:3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "ID": { threshold: 100000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Idaho Code § 15-3-1201"], probateTerm: "Informal Probate", probateCitation: ["Idaho Code § 15-3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "IL": {
        threshold: 150000,
        smallEstateTerm: "Small Estate Affidavit",
        smallEstateCitation: ["755 ILCS 5/25-1"],
        probateTerm: "Formal Probate",
        probateCitation: ["755 ILCS 5/"],
        isUPC: false,
        lettersTerm: "Letters of Office",
        notes: "Increased to $150,000 effective August 15, 2025."
    },
    "IN": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Ind. Code § 29-1-8-1"], probateTerm: "Formal Probate", probateCitation: ["Ind. Code § 29-1"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "IA": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Iowa Code § 633.356"], probateTerm: "Formal Probate", probateCitation: ["Iowa Code § 633"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "KS": { threshold: 75000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["K.S.A. § 59-1507b"], probateTerm: "Formal Probate", probateCitation: ["K.S.A. § 59"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "KY": { threshold: 30000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["K.R.S. § 395.455"], probateTerm: "Formal Probate", probateCitation: ["K.R.S. § 395"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "LA": { threshold: 125000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["La. C.C.P. Art. 3421"], probateTerm: "Formal Probate", probateCitation: ["La. C.C.P."], isUPC: false, lettersTerm: "Letters of Appointment" },
    "ME": { threshold: 40000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["18-C M.R.S. § 3-1201"], probateTerm: "Informal Probate", probateCitation: ["18-C M.R.S. § 3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "MD": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Md. Code, Est. & Trusts § 5-601"], probateTerm: "Formal Probate", probateCitation: ["Md. Code, Est. & Trusts"], isUPC: false, lettersTerm: "Letters of Administration" },
    "MA": {
        threshold: 25000,
        smallEstateTerm: "Voluntary Administration",
        smallEstateCitation: ["M.G.L. c. 190B, § 3-1201"],
        probateTerm: "Probate",
        probateCitation: ["M.G.L. c. 190B"],
        isUPC: true,
        lettersTerm: "Letters of Authority",
        probateSystem: "MUPC",
        claimWindowDays: 365,
        shortenedWindowDays: 120,
        estateTaxThreshold: 2000000,
        bondDefaultRequired: true
    },
    "MI": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["M.C.L. § 700.3983"], probateTerm: "Informal Probate", probateCitation: ["M.C.L. § 700.3301"], isUPC: true, lettersTerm: "Letters of Authority", notes: "Threshold adjusted annually for inflation ($50k for 2024)." },
    "MN": { threshold: 75000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Minn. Stat. § 524.3-1201"], probateTerm: "Informal Probate", probateCitation: ["Minn. Stat. § 524.3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "MS": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Miss. Code § 91-7-322"], probateTerm: "Formal Probate", probateCitation: ["Miss. Code § 91-7"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "MO": { threshold: 40000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Mo. Rev. Stat. § 473.097"], probateTerm: "Formal Probate", probateCitation: ["Mo. Rev. Stat. § 473"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "MT": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Mont. Code § 72-3-1101"], probateTerm: "Informal Probate", probateCitation: ["Mont. Code § 72-3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "NE": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Neb. Rev. Stat. § 30-24,125"], probateTerm: "Informal Probate", probateCitation: ["Neb. Rev. Stat. § 30-24"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "NV": { threshold: 25000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["N.R.S. § 146.080"], probateTerm: "Formal Probate", probateCitation: ["N.R.S. § 136"], isUPC: false, lettersTerm: "Letters Testamentary", notes: "Higher threshold ($100k) if surviving spouse is the heir." },
    "NH": { threshold: 10000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["N.H. Rev. Stat. § 553:31-a"], probateTerm: "Formal Probate", probateCitation: ["N.H. Rev. Stat. § 553"], isUPC: false, lettersTerm: "Letters of Administration" },
    "NJ": { threshold: 20000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["N.J.S.A. § 3B:10-3"], probateTerm: "Formal Probate", probateCitation: ["N.J.S.A. § 3B"], isUPC: false, lettersTerm: "Letters of Administration", notes: "Higher threshold ($50k) if surviving spouse is the heir." },
    "NM": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["N.M. Stat. § 45-3-1201"], probateTerm: "Informal Probate", probateCitation: ["N.M. Stat. § 45-3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "NY": {
        threshold: 50000,
        smallEstateTerm: "Voluntary Administration",
        smallEstateCitation: ["NY SCPA Article 13"],
        probateTerm: "Formal Administration",
        probateCitation: ["NY SCPA Article 14"],
        isUPC: false,
        lettersTerm: "Letters of Authority"
    },
    "NC": { threshold: 20000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["N.C.G.S. § 28A-25-1"], probateTerm: "Formal Probate", probateCitation: ["N.C.G.S. § 28A"], isUPC: false, lettersTerm: "Letters Testamentary", notes: "$30k if surviving spouse is sole heir." },
    "ND": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["N.D. Cent. Code § 30.1-23-01"], probateTerm: "Informal Probate", probateCitation: ["N.D. Cent. Code § 30.1-14-01"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "OH": { threshold: 35000, smallEstateTerm: "Release from Administration", smallEstateCitation: ["R.C. § 2113.03"], probateTerm: "Formal Probate", probateCitation: ["R.C. § 2113"], isUPC: false, lettersTerm: "Letters of Administration", notes: "$100k if surviving spouse is sole heir." },
    "OK": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["58 O.S. § 393"], probateTerm: "Formal Probate", probateCitation: ["58 O.S."], isUPC: false, lettersTerm: "Letters Testamentary" },
    "OR": { threshold: 75000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["O.R.S. § 114.515"], probateTerm: "Formal Probate", probateCitation: ["O.R.S. § 113"], isUPC: false, lettersTerm: "Letters Testamentary", notes: "Limit is for personal property. Real property limit is $200k." },
    "PA": {
        threshold: 50000,
        smallEstateTerm: "Settlement of Small Estates",
        smallEstateCitation: ["20 Pa. C.S. § 3102"],
        probateTerm: "Formal Probate",
        probateCitation: ["20 Pa. C.S."],
        isUPC: false,
        lettersTerm: "Letters Testamentary"
    },
    "RI": { threshold: 25000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["R.I.G.L. § 33-24-1"], probateTerm: "Formal Probate", probateCitation: ["R.I.G.L. § 33"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "SC": { threshold: 25000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["S.C. Code § 62-3-1201"], probateTerm: "Informal Probate", probateCitation: ["S.C. Code § 62-3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "SD": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["S.D.C.L. § 29A-3-1201"], probateTerm: "Informal Probate", probateCitation: ["S.D.C.L. § 29A-3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "TN": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["T.C.A. § 30-4-101"], probateTerm: "Formal Probate", probateCitation: ["T.C.A. § 30-1"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "TX": {
        threshold: 75000,
        smallEstateTerm: "Small Estate Affidavit",
        smallEstateCitation: ["TX Estates Code §205"],
        probateTerm: "Independent Administration",
        probateCitation: ["TX Estates Code §401"],
        isUPC: false,
        lettersTerm: "Letters Testamentary",
        notes: "Supports Muniment of Title for uncontested wills."
    },
    "UT": { threshold: 100000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Utah Code § 75-3-1201"], probateTerm: "Informal Probate", probateCitation: ["Utah Code § 75-3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "VT": { threshold: 45000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["14 V.S.A. § 1902"], probateTerm: "Formal Probate", probateCitation: ["14 V.S.A."], isUPC: false, lettersTerm: "Letters Testamentary" },
    "VA": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Va. Code § 64.2-601"], probateTerm: "Formal Probate", probateCitation: ["Va. Code § 64.2"], isUPC: false, lettersTerm: "Letters of Qualification" },
    "WA": { threshold: 100000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["R.C.W. § 11.62.010"], probateTerm: "Formal Probate", probateCitation: ["R.C.W. § 11"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "WV": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["W. Va. Code § 44-1A-1"], probateTerm: "Formal Probate", probateCitation: ["W. Va. Code § 44"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "WI": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Wis. Stat. § 867.03"], probateTerm: "Formal Probate", probateCitation: ["Wis. Stat. § 867"], isUPC: false, lettersTerm: "Letters of Administration" },
    "WY": { threshold: 200000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Wyo. Stat. § 2-1-201"], probateTerm: "Formal Probate", probateCitation: ["Wyo. Stat. § 2-1"], isUPC: false, lettersTerm: "Letters Testamentary" }
};

// Default rule for unknown states or those following basic UPC patterns
export const DEFAULT_STATE_RULE: StateRule = {
    threshold: 50000,
    smallEstateTerm: "Small Estate Affidavit",
    smallEstateCitation: ["State Small Estate Statute"],
    probateTerm: "Formal Probate",
    probateCitation: ["State Probate Code"],
    isUPC: false,
    lettersTerm: "Letters of Authority"
};

// UPC States Mapping
export const UPC_STATES = [
    "AK", "AZ", "CO", "HI", "ID", "ME", "MA", "MI", "MN", "MT",
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

export function getLettersTerm(stateCode?: string, hasWill?: boolean): string {
    if (!stateCode || !STATE_RULES[stateCode]) {
        return hasWill === false ? "Letters of Administration" : "Letters Testamentary";
    }
    const rule = STATE_RULES[stateCode];
    if (hasWill === false) return "Letters of Administration";
    if (hasWill === true) return "Letters Testamentary";
    return rule.lettersTerm;
}
