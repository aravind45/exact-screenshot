/**
 * ─────────────────────────────────────────────────────────────────────────
 * JURISDICTION DATA — SINGLE SOURCE OF TRUTH
 * ─────────────────────────────────────────────────────────────────────────
 * All state-level probate/tax facts used across the app live here.
 *
 * Consumers (do NOT create parallel copies):
 *  - src/lib/stateRules.ts            → thresholds & procedure metadata
 *  - src/lib/probateFees.ts           → statutory fee schedules
 *  - src/components/dashboard/TaxAlerts.tsx → estate/inheritance tax tables
 *  - prisma/seedJurisdictionRules.ts  → database seeds (reads this file)
 *
 * Data verified 2026-07-27 against primary sources:
 *  - Federal estate tax: One Big Beautiful Bill Act (P.L. 119-21, signed
 *    2025-07-04) → $15,000,000/person effective 2026-01-01, inflation-indexed.
 *  - CA small estate: $208,850 (deaths 2025-04-01 → 2026-03-31),
 *    $239,700 (deaths on/after 2026-04-01) — annual CPI adjustment, Prob. Code §890.
 *  - AB 2016 (Prob. Code §13151-13154): primary-residence petition ≤ $750,000,
 *    effective 2025-04-01.
 *  - State estate/inheritance tax figures reflect 2025–2026 published values.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── Federal estate tax ────────────────────────────────────────────────────
export const FEDERAL_ESTATE_TAX = {
  /** Basic exclusion amount for deaths in 2026 (P.L. 119-21). */
  exemption2026: 15_000_000,
  /** 2025 exclusion (for estates of decedents dying in 2025). */
  exemption2025: 13_990_000,
  /** Top federal estate tax rate. */
  topRate: 0.40,
  /** Form 706 filing deadline (months after date of death). */
  form706DueMonths: 9,
  citation: "IRC §2010(c), as amended by P.L. 119-21 (2025)",
} as const;

/** Returns the applicable federal exemption for a given date of death. */
export function getFederalExemption(dateOfDeath?: Date | null): number {
  if (!dateOfDeath) return FEDERAL_ESTATE_TAX.exemption2026;
  return dateOfDeath < new Date("2026-01-01")
    ? FEDERAL_ESTATE_TAX.exemption2025
    : FEDERAL_ESTATE_TAX.exemption2026;
}

// ── State estate tax (threshold = exemption amount) ───────────────────────
// States with a stand-alone estate tax. Values reflect 2025–2026 law.
export const STATE_ESTATE_TAX_THRESHOLDS: Record<string, number> = {
  OR: 1_000_000,
  MA: 2_000_000,
  RI: 1_802_431,   // 2026 indexed
  MN: 3_000_000,
  WA: 2_193_000,
  VT: 5_000_000,
  IL: 4_000_000,
  ME: 7_160_000,   // 2026 indexed
  MD: 5_000_000,
  NY: 7_160_000,   // 2026 indexed
  CT: 15_000_000,  // conforms to federal from 2026 (P.L. 119-21 conformity)
  DC: 4_873_200,   // 2026 indexed
  HI: 5_490_000,
};

// ── State inheritance tax (tax on the recipient, not the estate) ──────────
export const INHERITANCE_TAX_STATES = ["KY", "MD", "NE", "NJ", "PA"] as const;

// ── California-specific rules ─────────────────────────────────────────────
export const CALIFORNIA = {
  /** §13100 personal-property small-estate threshold by date of death. */
  smallEstateThreshold(dateOfDeath?: Date | null): number {
    if (dateOfDeath && dateOfDeath >= new Date("2026-04-01")) return 239_700;
    return 208_850; // deaths 2025-04-01 → 2026-03-31 (and current default)
  },
  /** AB 2016: simplified petition for a primary residence (§13151-13154). */
  primaryResidencePetition: {
    maxValue: 750_000,
    effectiveDate: "2025-04-01",
    citation: "CA Prob. Code §§13151–13154 (AB 2016)",
    note: "Streamlined court petition for the decedent's primary residence valued ≤ $750,000 (gross), effective April 1, 2025.",
  },
  /** Waiting period before a small-estate affidavit may be presented. */
  smallEstateWaitingDays: 40,
  /** Creditor claim window: later of 4 months after Letters or 60 days after notice. */
  creditorWindowDaysAfterLetters: 120,
  creditorWindowDaysAfterNotice: 60,
  /** Initial probate petition court filing fee (2025, statewide base + county surcharges vary). */
  initialFilingFee: 435,
  /** Probate referee appraisal fee (percentage of appraised value). */
  refereeFeeRate: 0.001,
} as const;

// ── Statutory fee schedule (California Prob. Code §§10800, 10810) ─────────
// §10800: personal representative compensation; §10810: attorney compensation.
// Both use the SAME graduated schedule. Over $25M: reasonable amount set by court.
export interface FeeTier {
  upTo: number;      // cumulative cap for this tier
  rate: number;
}
export const CA_STATUTORY_FEE_TIERS: FeeTier[] = [
  { upTo: 100_000, rate: 0.04 },        // 4% of first $100k
  { upTo: 200_000, rate: 0.03 },        // 3% of next $100k
  { upTo: 1_000_000, rate: 0.02 },      // 2% of next $800k
  { upTo: 10_000_000, rate: 0.01 },     // 1% of next $9M
  { upTo: 25_000_000, rate: 0.005 },    // 0.5% of next $15M
];

export function calculateCAStatutoryFee(inventoryValue: number): number {
  let fee = 0;
  let previousCap = 0;
  for (const tier of CA_STATUTORY_FEE_TIERS) {
    if (inventoryValue <= previousCap) break;
    const taxable = Math.min(inventoryValue, tier.upTo) - previousCap;
    fee += taxable * tier.rate;
    previousCap = tier.upTo;
  }
  // Above $25M the court determines a reasonable amount — not computed here.
  return fee;
}

/** Minimum first overbid at a court confirmation hearing (Prob. Code §10311). */
export function calculateCAFirstOverbid(acceptedBid: number): number {
  const increase = Math.max(500, Math.min(acceptedBid, 10_000) * 0.10 + Math.max(0, acceptedBid - 10_000) * 0.05);
  return acceptedBid + increase;
}

// ── Florida presumptively-reasonable fee schedule (Fla. Stat. §733.6171) ──
export const FL_STATUTORY_FEE_TIERS: FeeTier[] = [
  { upTo: 100_000, rate: 0.03 },        // 3% of first $1M (approximation)
  { upTo: 1_000_000, rate: 0.03 },
  { upTo: 3_000_000, rate: 0.025 },
  { upTo: 5_000_000, rate: 0.02 },
  { upTo: 10_000_000, rate: 0.015 },
];

export function calculateFLStatutoryFee(value: number): number {
  let fee = 0;
  let previousCap = 0;
  for (const tier of FL_STATUTORY_FEE_TIERS) {
    if (value <= previousCap) break;
    const taxable = Math.min(value, tier.upTo) - previousCap;
    fee += taxable * tier.rate;
    previousCap = tier.upTo;
  }
  return fee;
}

// ── New York executor commissions (SCPA §2307) ────────────────────────────
export const NY_EXECUTOR_COMMISSION_TIERS: FeeTier[] = [
  { upTo: 100_000, rate: 0.05 },
  { upTo: 200_000, rate: 0.04 },
  { upTo: 300_000, rate: 0.03 },
  { upTo: 400_000, rate: 0.025 },
  { upTo: 500_000, rate: 0.02 },
  { upTo: 1_000_000, rate: 0.02 },
  { upTo: 5_000_000, rate: 0.02 },
];

export function calculateNYCommission(value: number): number {
  let fee = 0;
  let previousCap = 0;
  for (const tier of NY_EXECUTOR_COMMISSION_TIERS) {
    if (value <= previousCap) break;
    const taxable = Math.min(value, tier.upTo) - previousCap;
    fee += taxable * tier.rate;
    previousCap = tier.upTo;
  }
  return fee;
}

// ── Timeline benchmarks (months, uncontested formal probate) ─────────────
export interface TimelineBenchmark {
  minMonths: number;
  maxMonths: number;
  note?: string;
}
export const PROBATE_TIMELINES: Record<string, TimelineBenchmark> = {
  CA: { minMonths: 12, maxMonths: 24, note: "Court-supervised by default; large-county backlogs (e.g., LA 12–24+ months)." },
  TX: { minMonths: 6, maxMonths: 12, note: "Independent administration default; muniment of title 30–60 days if no debts." },
  FL: { minMonths: 6, maxMonths: 12, note: "Summary administration available for ≤$75k or >2 years since death." },
  NY: { minMonths: 12, maxMonths: 18, note: "7-month creditor period; Surrogate's Court backlogs." },
  IL: { minMonths: 6, maxMonths: 12, note: "Independent administration available; Cook County backlogs add months." },
  DEFAULT: { minMonths: 9, maxMonths: 18, note: "National average for uncontested formal probate." },
};

// ── Typical ancillary costs ───────────────────────────────────────────────
export const ANCILLARY_COSTS = {
  publicationNotice: { min: 100, max: 300 },
  bondPremiumRate: { min: 0.001, max: 0.005 },   // per year, often waived
  realPropertyAppraisal: { min: 300, max: 600 },
  personalPropertyAppraisal: { min: 200, max: 1000 },
  cpaFees: { min: 500, max: 3000 },
  certifiedDeathCertificate: { min: 10, max: 25 },
} as const;

// ── California Proposition 19 (parent-child transfer exclusion) ──────────
export const CA_PROP19 = {
  /** Assessed-value cap for the parent-child exclusion (indexed annually). */
  assessedValueCap2025: 1_044_586,
  exclusionRequirements: [
    "Property must have been the parents' primary residence (or family farm)",
    "Child must use the property as their own primary residence",
    "Child must move in within 1 year of the transfer",
    "File claim form BOE-19-P with the county assessor",
    "Only the first $1M+ of assessed value above the base is protected",
  ],
  claimDeadlineNote: "File BOE-19-P within 3 years of transfer (or before transfer to a third party); late claims reduce relief.",
  forms: ["BOE-19-P (parent-child exclusion)", "BOE-19-G (grandparent-grandchild)"],
  annualCostWarning: "Missing the exclusion on a $1.5M home can cost heirs $10,000–$15,000+ per year in additional property tax — permanently.",
  citation: "Cal. Const. art. XIIIA §2.1; Rev. & Tax. Code §63.2 (Prop 19, eff. 2021-02-16)",
} as const;

// ── California Medi-Cal estate recovery (DHCS) ────────────────────────────
export const CA_MEDICAL_RECOVERY = {
  appliesWhen: "Decedent received Medi-Cal benefits (esp. long-term care) and assets pass through probate",
  postSB833Note: "Since 2017 (SB 833), recovery is generally limited to assets passing through probate — but that is precisely the population using formal probate.",
  requiredSteps: [
    "Check whether the decedent received Medi-Cal benefits after age 55 or in a nursing facility",
    "Submit a DHCS Estate Recovery inquiry before final distribution",
    "Do not distribute until DHCS responds or the claim window closes",
  ],
  personalLiabilityWarning: "An executor who distributes without resolving a Medi-Cal recovery claim can be personally liable to DHCS.",
  agency: "California Dept. of Health Care Services (DHCS), Estate Recovery Section",
  citation: "Welf. & Inst. Code §14009.5 (as amended by SB 833, 2016)",
} as const;

// ── Digital assets (RUFADAA) ──────────────────────────────────────────────
export const RUFADAA = {
  statesEnacted: 46, // plus D.C., as of 2024
  tiers: [
    "1) Platform online tools (e.g., Google Inactive Account Manager, Apple/Meta legacy contacts)",
    "2) Directions in will / trust / power of attorney",
    "3) Platform terms of service / default law",
  ],
  contentNote: "Content of electronic communications generally requires the decedent's explicit consent; otherwise fiduciaries receive only metadata/catalogue information.",
  citation: "Revised Uniform Fiduciary Access to Digital Assets Act (2015)",
} as const;
