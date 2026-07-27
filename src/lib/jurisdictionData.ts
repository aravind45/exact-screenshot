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
  MN: 3_000_000,   // + portability for deaths after 2025-06-30
  WA: 3_076_000,   // 2026 (ESSB 5813: $3M eff. 2025-07-01, indexed); top rate now 35%
  VT: 5_000_000,
  IL: 4_000_000,   // frozen, not indexed; NOT portable
  ME: 7_160_000,   // 2026 indexed
  MD: 5_000_000,   // fixed; portable; ONLY state with both estate + inheritance tax (10% flat)
  NY: 7_350_000,   // 2026 indexed (Tax Law §952); cliff at 105% — see NY_ESTATE_TAX
  CT: 15_000_000,  // conforms to federal from 2026; flat 12%; only state with a gift tax
  DC: 4_873_200,   // 2026 indexed
  HI: 5_490_000,
};

// ── Texas executor commissions (TX Estates Code §352.002) ─────────────────
// 5% of cash RECEIVED + 5% of cash PAID OUT — but excluding pass-through
// items (life insurance, POD accounts, debts paid at death). Effective rate
// on the gross estate is typically ~2–3%, NOT 5%.
export const TX_EXECUTOR_COMMISSION = {
  statutoryRate: 0.05,
  effectiveRateEstimate: 0.025, // typical effective % of gross estate
  note: "5% on cash in + 5% on cash out, excluding pass-through receipts (insurance, POD, certain debts) — effective cost is roughly 2–3% of the gross estate.",
  citation: "TX Estates Code §352.002",
} as const;

// ── Texas Small Estate Affidavit (intestate only) ─────────────────────────
export const TX_SMALL_ESTATE = {
  threshold: 75_000,
  intestateOnly: true,
  requirements: [
    "No will (intestate estates ONLY — a will must go through muniment of title or administration)",
    "Estate assets (excluding homestead & exempt property) ≤ $75,000",
    "Assets exceed debts (except secured debts on homestead)",
    "All heirs + two disinterested witnesses must sign",
    "Only real property allowed: the homestead, passing to a homesteading spouse or minor children",
  ],
  citation: "TX Estates Code §205",
} as const;

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

// ── Florida presumptively-reasonable attorney fees (Fla. Stat. §733.6171(3)) ──
// ≤$40k: $1,500 · $40–70k: $2,250 · $70–100k: $3,000
// then graduated: 3% to $1M · 2.5% to $3M · 2% to $5M · 1.5% to $10M · 1% above
export function calculateFLStatutoryFee(value: number): number {
  if (value <= 0) return 0;
  if (value <= 40_000) return 1_500;
  if (value <= 70_000) return 2_250;
  if (value <= 100_000) return 3_000;
  if (value <= 1_000_000) return value * 0.03;
  if (value <= 3_000_000) return 30_000 + (value - 1_000_000) * 0.025;
  if (value <= 5_000_000) return 80_000 + (value - 3_000_000) * 0.02;
  if (value <= 10_000_000) return 120_000 + (value - 5_000_000) * 0.015;
  return 195_000 + (value - 10_000_000) * 0.01;
}

// ── Florida personal representative commissions (Fla. Stat. §733.617) ──────
// NOTE: different band edges than the attorney schedule:
//   3% first $1M · 2.5% next $4M · 2% next $5M · 1.5% above $10M
export function calculateFLPRCommission(value: number): number {
  if (value <= 0) return 0;
  if (value <= 1_000_000) return value * 0.03;
  if (value <= 5_000_000) return 30_000 + (value - 1_000_000) * 0.025;
  if (value <= 10_000_000) return 130_000 + (value - 5_000_000) * 0.02;
  return 230_000 + (value - 10_000_000) * 0.015;
}

export const FL_FEE_DISCLOSURE_NOTE =
  "Fla. Stat. §733.6171(7): attorneys must provide the mandated written fee disclosures; failure bars compensation without court approval (HB 625, 2021).";

// ── Florida summary administration threshold (with 2026 expansion) ─────────
export const FL_SUMMARY_ADMINISTRATION = {
  threshold(dateOfDeath?: Date | null): number {
    // CS/HB 1337 (2026): threshold doubles from $75,000 to $150,000 for
    // deaths on/after July 1, 2026.
    if (dateOfDeath && dateOfDeath >= new Date("2026-07-01")) return 150_000;
    return 75_000;
  },
  twoYearRule: "Summary administration is also available at ANY value if the decedent died 2+ years ago (§735.201).",
  dispositionWithoutAdmin: { current: 10_000, fromJuly2026: 20_000, citation: "Fla. Stat. §735.301" },
  homesteadNote: "FL homestead is constitutionally protected from most creditors, is NOT part of the probate estate, and passes outside administration — but title requires a court determination (Order Determining Homestead).",
  citation: "Fla. Stat. §735.201 (as amended by CS/HB 1337, eff. 2026-07-01)",
} as const;

// ── Florida elective share ──────────────────────────────────────────────────
export const FL_ELECTIVE_SHARE = {
  rate: 0.30,
  note: "Surviving spouse may claim 30% of the ELECTIVE ESTATE — which includes many non-probate assets (revocable trusts, POD accounts, joint property), unlike most states.",
  citation: "Fla. Stat. §§732.201–732.2155",
} as const;

// ── New York executor commissions (SCPA §2307) ────────────────────────────
// Statutory receiving & paying-out commissions:
//   5% of first $100,000 · 4% of next $200,000 · 3% of next $700,000
//   2.5% of next $4,000,000 · 2% of all above $5,000,000
// Customarily taken as HALF for receiving + HALF for paying out the same sums.
export const NY_EXECUTOR_COMMISSION_TIERS: FeeTier[] = [
  { upTo: 100_000, rate: 0.05 },
  { upTo: 300_000, rate: 0.04 },
  { upTo: 1_000_000, rate: 0.03 },
  { upTo: 5_000_000, rate: 0.025 },
  { upTo: Infinity, rate: 0.02 },
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

// SCPA §2307: for estates over $300,000, up to THREE fiduciaries may each
// receive full commissions; below that, the commission is apportioned.
export const NY_COMMISSION_RULES = {
  coExecutorFullCommissionsThreshold: 300_000,
  maxFullCommissions: 3,
  receivePayoutNote: "Commissions are customarily taken as half for receiving and half for paying out the estate funds.",
  citation: "NY SCPA §2307",
} as const;

// ── New York estate tax (Tax Law §952) — THE CLIFF ────────────────────────
// If the taxable estate exceeds 105% of the Basic Exclusion Amount (BEA),
// the exclusion is lost ENTIRELY and the whole estate is taxed from dollar one.
export const NY_ESTATE_TAX = {
  basicExclusion: { 2025: 7_160_000, 2026: 7_350_000 },
  cliffMultiplier: 1.05,
  topRate: 0.16,
  maxRate: 0.16,
  minRate: 0.032,
  portable: false, // NY exclusion is NOT portable between spouses
  citation: "NY Tax Law §952",
} as const;

export interface NYEstateTaxResult {
  taxableEstate: number;
  exclusion: number;
  cliffThreshold: number;
  overExclusion: boolean;
  cliffTriggered: boolean;
  warning?: string;
}

export function evaluateNYEstateTax(taxableEstate: number, year: 2025 | 2026 = 2026): NYEstateTaxResult {
  const exclusion = NY_ESTATE_TAX.basicExclusion[year];
  const cliffThreshold = Math.round(exclusion * NY_ESTATE_TAX.cliffMultiplier);
  const overExclusion = taxableEstate > exclusion;
  const cliffTriggered = taxableEstate > cliffThreshold;
  let warning: string | undefined;
  if (cliffTriggered) {
    warning = `CLIFF TRIGGERED: estate exceeds 105% of the NY exclusion ($${cliffThreshold.toLocaleString()}). The exclusion is lost entirely — the ENTIRE estate is taxed from dollar one, not just the excess.`;
  } else if (overExclusion) {
    const headroom = cliffThreshold - taxableEstate;
    warning = `Within the cliff zone: only $${headroom.toLocaleString()} below the 105% cliff. If the estate grows past $${cliffThreshold.toLocaleString()}, the entire exclusion is lost.`;
  }
  return { taxableEstate, exclusion, cliffThreshold, overExclusion, cliffTriggered, warning };
}

// ── New Jersey small estate (intestate only) ──────────────────────────────
// N.J.S.A. 3B:10-3 / 3B:10-4 apply ONLY when there is NO WILL.
//   - $50,000 for a surviving spouse / domestic partner (sole heir)
//   - $20,000 for all other heirs (with written consent of remaining heirs)
// Real property is excluded; affidavit may be used 30 days after death.
export const NJ_SMALL_ESTATE = {
  spouseThreshold: 50_000,
  otherHeirThreshold: 20_000,
  intestateOnly: true,
  waitingDays: 30,
  noRealProperty: true,
  citation: "N.J.S.A. 3B:10-3 (spouse), 3B:10-4 (other heirs)",
  note: "Available only for intestate estates — if there is a will, it must be probated through the Surrogate's Court.",
} as const;

// ── New Jersey inheritance tax (not an estate tax — tax on recipients) ────
export const NJ_INHERITANCE_TAX = {
  classes: {
    A: { beneficiaries: "Spouse, civil union/domestic partner, children, parents, grandparents, lineal descendants", rate: 0, note: "Fully exempt" },
    C: { beneficiaries: "Siblings, sons/daughters-in-law", exemption: 25_000, rates: "11%–16% graduated" },
    D: { beneficiaries: "All others (nieces, nephews, friends, unrelated)", exemption: 0, rates: "15% first $700k, 16% above" },
  },
  returnDueMonths: 8, // IT-R due 8 months after death
  citation: "N.J.S.A. 54:33-1 et seq.",
} as const;

// ── New Jersey tax waivers (the practical blocker) ────────────────────────
// NJ law freezes up to 50% of bank accounts and places an automatic lien on
// NJ real estate until the Division of Taxation issues a waiver.
export const NJ_TAX_WAIVERS = {
  L8: { purpose: "Self-executing waiver for bank/brokerage accounts, Class A beneficiaries only — no full return needed" },
  L9: { purpose: "Self-executing waiver releasing the lien on NJ real estate, Class A beneficiaries only" },
  IT_R: { purpose: "Full inheritance tax return — required for Class C/D beneficiaries, due 8 months after death" },
  freezeNote: "Institutions may freeze up to 50% of account balances until a waiver or L-8 is presented.",
  lienNote: "NJ real estate carries an automatic inheritance-tax lien until released (L-9 or waiver).",
  citation: "N.J.A.C. 18:26-11; NJ Division of Taxation waiver program",
} as const;

// ── New York Surrogate's Court filing fees (SCPA §2402, tiered) ───────────
export const NY_SURROGATE_FILING_FEES: { upTo: number; fee: number }[] = [
  { upTo: 10_000, fee: 45 },
  { upTo: 20_000, fee: 75 },
  { upTo: 50_000, fee: 215 },
  { upTo: 100_000, fee: 280 },
  { upTo: 250_000, fee: 420 },
  { upTo: 500_000, fee: 625 },
  { upTo: Infinity, fee: 1_250 }, // $500,000 and over
];

export function getNYSurrogateFilingFee(estateValue: number): number {
  for (const tier of NY_SURROGATE_FILING_FEES) {
    if (estateValue < tier.upTo) return tier.fee;
  }
  return 1_250;
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
