/**
 * deadlineRules.ts
 * Comprehensive statutory deadline definitions for all 13 probate tracks.
 * Each rule specifies an anchor date type, an offset in days, a legal citation,
 * and which authority tracks it applies to.
 */

export type AnchorType =
  | "DOD"       // Date of Death
  | "LETTERS"   // Letters Testamentary / Administration issued (appointedDate)
  | "HEARING"   // Court hearing date
  | "TAX_YEAR"; // April 15 of the year following the tax year

export type DeadlinePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface DeadlineRule {
  id: string;
  title: string;
  description: string;
  legalBasis: string;
  anchorType: AnchorType;
  offsetDays: number;
  warningDays: number;      // surface alert this many days before due
  priority: DeadlinePriority;
  isStatutory: boolean;
  tracks: string[];         // authority types this rule applies to; [] = all tracks
  stateOverrides?: Record<string, {
    offsetDays: number;
    legalBasis: string;
    title?: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL DEADLINES — apply to every track
// ─────────────────────────────────────────────────────────────────────────────
export const UNIVERSAL_DEADLINES: DeadlineRule[] = [
  {
    id: "FINAL_1040",
    title: "File Decedent's Final Income Tax Return (Form 1040)",
    description:
      "The executor must file the decedent's final federal income tax return covering Jan 1 of the year of death through the date of death.",
    legalBasis: "IRC §6012(b)(1); 26 U.S.C. §6151",
    anchorType: "TAX_YEAR",
    offsetDays: 0, // April 15 of following year — computed specially
    warningDays: 60,
    priority: "CRITICAL",
    isStatutory: true,
    tracks: [],
  },
  {
    id: "EIN_OBTAIN",
    title: "Obtain Estate EIN (Employer Identification Number)",
    description:
      "Apply for an EIN for the estate to open an estate bank account, receive estate income, and file estate tax returns.",
    legalBasis: "IRS Rev. Proc. 2001-7; Form SS-4",
    anchorType: "DOD",
    offsetDays: 30,
    warningDays: 14,
    priority: "HIGH",
    isStatutory: false,
    tracks: [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FEDERAL ESTATE TAX — only for large estates
// ─────────────────────────────────────────────────────────────────────────────
export const ESTATE_TAX_DEADLINES: DeadlineRule[] = [
  {
    id: "ESTATE_TAX_706",
    title: "File Federal Estate Tax Return (Form 706)",
    description:
      "Required if the gross estate exceeds the federal exemption ($13.61M in 2024). File within 9 months of date of death.",
    legalBasis: "IRC §6018; 26 U.S.C. §6075(a)",
    anchorType: "DOD",
    offsetDays: 274, // 9 months ≈ 274 days
    warningDays: 60,
    priority: "CRITICAL",
    isStatutory: true,
    tracks: [],
  },
  {
    id: "DSUE_PORTABILITY",
    title: "DSUE Portability Election (Form 706)",
    description:
      "Surviving spouse may elect to use the decedent's unused estate tax exclusion (DSUE). Must file Form 706 even if no tax is owed. Extended to 5 years under Rev. Proc. 2022-32.",
    legalBasis: "IRC §2010(c)(5)(A); Rev. Proc. 2022-32",
    anchorType: "DOD",
    offsetDays: 274, // same 9-month window (5-year extended election available separately)
    warningDays: 90,
    priority: "HIGH",
    isStatutory: true,
    tracks: [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROBATE TRACKS: FORMAL_PROBATE, INFORMAL_PROBATE, INTESTATE
// ─────────────────────────────────────────────────────────────────────────────
export const PROBATE_DEADLINES: DeadlineRule[] = [
  {
    id: "FILE_PETITION",
    title: "File Petition for Probate",
    description:
      "File the petition to open probate with the appropriate probate court. While there is generally no absolute statutory deadline, delay beyond 30 days risks asset dissipation and creditor priority disputes.",
    legalBasis: "State probate code — consult local rules",
    anchorType: "DOD",
    offsetDays: 30,
    warningDays: 7,
    priority: "HIGH",
    isStatutory: false,
    tracks: ["FORMAL_PROBATE", "INFORMAL_PROBATE", "INTESTATE"],
    stateOverrides: {
      TX: { offsetDays: 1460, legalBasis: "TX Estates Code §256.003 — 4 years from DOD" },
    },
  },
  {
    id: "CREDITOR_NOTICE_PUBLISH",
    title: "Publish Notice to Creditors",
    description:
      "Publish legal notice to creditors in a county newspaper of general circulation. Required to start the creditor claim period clock.",
    legalBasis: "State probate code — publication requirement",
    anchorType: "LETTERS",
    offsetDays: 30,
    warningDays: 10,
    priority: "CRITICAL",
    isStatutory: true,
    tracks: ["FORMAL_PROBATE", "INFORMAL_PROBATE", "INTESTATE"],
    stateOverrides: {
      CA: { offsetDays: 30, legalBasis: "CA Prob. Code §8120" },
      TX: { offsetDays: 30, legalBasis: "TX Estates Code §308.051" },
      FL: { offsetDays: 30, legalBasis: "FL Stat. §733.2121" },
      NY: { offsetDays: 30, legalBasis: "NY SCPA §1002" },
    },
  },
  {
    id: "CREDITOR_CLAIM_PERIOD",
    title: "Creditor Claim Period Ends",
    description:
      "The deadline by which creditors must file claims against the estate. Distributing assets before this date creates personal liability for the executor.",
    legalBasis: "State probate code — claim period",
    anchorType: "LETTERS",
    offsetDays: 120, // 4 months default
    warningDays: 30,
    priority: "CRITICAL",
    isStatutory: true,
    tracks: ["FORMAL_PROBATE", "INFORMAL_PROBATE", "INTESTATE"],
    stateOverrides: {
      CA: { offsetDays: 120, legalBasis: "CA Prob. Code §9100 — 4 months from Letters" },
      TX: { offsetDays: 120, legalBasis: "TX Estates Code §308.054 — 4 months from publication" },
      FL: { offsetDays: 90, legalBasis: "FL Stat. §733.702 — 3 months from publication or 30 days from actual notice" },
      NY: { offsetDays: 210, legalBasis: "NY SCPA §1802 — 7 months from Letters" },
      PA: { offsetDays: 365, legalBasis: "20 Pa. C.S. §3381 — 1 year from Letters" },
      OH: { offsetDays: 180, legalBasis: "R.C. §2117.06 — 6 months from appointment" },
      GA: { offsetDays: 90, legalBasis: "O.C.G.A. §53-7-40 — 3 months from publication" },
      IL: { offsetDays: 180, legalBasis: "755 ILCS 5/18-12 — 6 months from Letters" },
      NJ: { offsetDays: 180, legalBasis: "N.J.S.A. §3B:22-4 — 9 months from death or 6 months from Letters" },
      MA: { offsetDays: 365, legalBasis: "M.G.L. c.190B §3-803 — 1 year from death" },
    },
  },
  {
    id: "INVENTORY_APPRAISAL",
    title: "File Inventory & Appraisal",
    description:
      "Complete inventory of all probate assets with appraised fair market values as of date of death. Required for court accounting and estate tax purposes.",
    legalBasis: "State probate code — inventory deadline",
    anchorType: "LETTERS",
    offsetDays: 120, // 4 months default
    warningDays: 30,
    priority: "CRITICAL",
    isStatutory: true,
    tracks: ["FORMAL_PROBATE", "INFORMAL_PROBATE", "INTESTATE"],
    stateOverrides: {
      CA: { offsetDays: 120, legalBasis: "CA Prob. Code §8800 — 4 months from Letters" },
      TX: { offsetDays: 90, legalBasis: "TX Estates Code §309.051 — 90 days from appointment" },
      FL: { offsetDays: 60, legalBasis: "FL Stat. §733.604 — 60 days from appointment" },
      NY: { offsetDays: 274, legalBasis: "NY SCPA §2105 — 9 months from Letters" },
      PA: { offsetDays: 90, legalBasis: "20 Pa. C.S. §3301 — 90 days from grant of Letters" },
      OH: { offsetDays: 90, legalBasis: "R.C. §2115.02 — 3 months from appointment" },
      IL: { offsetDays: 60, legalBasis: "755 ILCS 5/14-1 — 60 days from Letters" },
    },
  },
  {
    id: "NOTICE_TO_HEIRS",
    title: "Send Notice to Heirs & Beneficiaries",
    description:
      "Formal written notice must be sent to all named beneficiaries and heirs-at-law informing them of the estate proceeding.",
    legalBasis: "State probate code — notice to beneficiaries",
    anchorType: "LETTERS",
    offsetDays: 60,
    warningDays: 14,
    priority: "HIGH",
    isStatutory: true,
    tracks: ["FORMAL_PROBATE", "INFORMAL_PROBATE", "INTESTATE"],
    stateOverrides: {
      CA: { offsetDays: 30, legalBasis: "CA Prob. Code §8100 — 30 days from filing" },
      FL: { offsetDays: 30, legalBasis: "FL Stat. §733.212 — 30 days from appointment" },
    },
  },
  {
    id: "ESTATE_INCOME_TAX_1041",
    title: "File Estate Income Tax Return (Form 1041)",
    description:
      "Required if the estate has gross income of $600 or more during administration. Due April 15 of the following year (or fiscal year-end + 3.5 months).",
    legalBasis: "IRC §6012(a)(3); 26 U.S.C. §6072",
    anchorType: "TAX_YEAR",
    offsetDays: 0,
    warningDays: 60,
    priority: "HIGH",
    isStatutory: true,
    tracks: ["FORMAL_PROBATE", "INFORMAL_PROBATE", "INTESTATE", "TRUST_ADMIN_REVOCABLE", "TRUST_ADMIN_IRREVOCABLE"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SMALL ESTATE — SMALL_ESTATE track
// ─────────────────────────────────────────────────────────────────────────────
export const SMALL_ESTATE_DEADLINES: DeadlineRule[] = [
  {
    id: "SMALL_ESTATE_WAITING_PERIOD",
    title: "Small Estate Waiting Period Expires",
    description:
      "Most states require a waiting period after death before a small estate affidavit may be used. After this date, the affidavit can be presented to institutions.",
    legalBasis: "State small estate statute",
    anchorType: "DOD",
    offsetDays: 40,
    warningDays: 5,
    priority: "HIGH",
    isStatutory: true,
    tracks: ["SMALL_ESTATE"],
    stateOverrides: {
      CA: { offsetDays: 40, legalBasis: "CA Prob. Code §13100 — 40 days from DOD" },
      TX: { offsetDays: 30, legalBasis: "TX Estates Code §205.001 — 30 days from DOD" },
      FL: { offsetDays: 0, legalBasis: "FL Stat. §735.201 — no waiting period for summary" },
      NY: { offsetDays: 30, legalBasis: "NY SCPA §1310 — 30 days from DOD" },
      CO: { offsetDays: 10, legalBasis: "C.R.S. §15-12-1201 — 10 days from DOD" },
      AZ: { offsetDays: 30, legalBasis: "A.R.S. §14-3971 — 30 days from DOD" },
      WA: { offsetDays: 40, legalBasis: "R.C.W. §11.62.010 — 40 days from DOD" },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FLORIDA SUMMARY ADMINISTRATION
// ─────────────────────────────────────────────────────────────────────────────
export const FL_SUMMARY_DEADLINES: DeadlineRule[] = [
  {
    id: "FL_SUMMARY_PETITION",
    title: "File Petition for Summary Administration",
    description:
      "File the Petition for Summary Administration with the circuit court. No formal administration; court issues Order of Summary Administration directly.",
    legalBasis: "FL Stat. §735.206",
    anchorType: "DOD",
    offsetDays: 60,
    warningDays: 14,
    priority: "HIGH",
    isStatutory: false,
    tracks: ["SUMMARY_ADMINISTRATION"],
  },
  {
    id: "FL_TWO_YEAR_BAR",
    title: "Two-Year Creditor Bar Expires",
    description:
      "Under FL Stat. §733.710, no proceeding may be commenced against the estate more than 2 years after the decedent's death regardless of notice. This is the ultimate creditor bar.",
    legalBasis: "FL Stat. §733.710",
    anchorType: "DOD",
    offsetDays: 730, // 2 years
    warningDays: 90,
    priority: "MEDIUM",
    isStatutory: true,
    tracks: ["SUMMARY_ADMINISTRATION", "FORMAL_PROBATE"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NEW YORK VOLUNTARY ADMINISTRATION
// ─────────────────────────────────────────────────────────────────────────────
export const NY_VOLUNTARY_DEADLINES: DeadlineRule[] = [
  {
    id: "NY_VOLUNTARY_FILING",
    title: "File Affidavit of Voluntary Administration (SCPA 1310)",
    description:
      "File with the Surrogate's Court. No formal appointment; voluntary administrator has limited powers. Estate must not exceed $50,000 in personal property.",
    legalBasis: "NY SCPA §1310",
    anchorType: "DOD",
    offsetDays: 60,
    warningDays: 14,
    priority: "HIGH",
    isStatutory: false,
    tracks: ["VOLUNTARY_ADMINISTRATION"],
  },
  {
    id: "NY_VOLUNTARY_CREDITOR_PERIOD",
    title: "Creditor Claim Period Ends (NY Voluntary)",
    description:
      "Under voluntary administration, creditors have 7 months from issuance of Letters or appointment to file claims.",
    legalBasis: "NY SCPA §1802",
    anchorType: "LETTERS",
    offsetDays: 210, // 7 months
    warningDays: 30,
    priority: "CRITICAL",
    isStatutory: true,
    tracks: ["VOLUNTARY_ADMINISTRATION"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TEXAS MUNIMENT OF TITLE
// ─────────────────────────────────────────────────────────────────────────────
export const TX_MUNIMENT_DEADLINES: DeadlineRule[] = [
  {
    id: "TX_MUNIMENT_FILING",
    title: "File Application for Muniment of Title",
    description:
      "Must be filed within 4 years of death. Used when decedent had a will, estate has no debts, and only property transfers are needed — no executor is appointed.",
    legalBasis: "TX Estates Code §257.001; §256.003",
    anchorType: "DOD",
    offsetDays: 1460, // 4 years
    warningDays: 90,
    priority: "HIGH",
    isStatutory: true,
    tracks: ["MUNIMENT_OF_TITLE"],
  },
  {
    id: "TX_MUNIMENT_RECORD",
    title: "Record Order in County Deed Records",
    description:
      "After the court approves the Muniment of Title, record the certified copy in the county deed records of each county where real property is located.",
    legalBasis: "TX Estates Code §257.101",
    anchorType: "HEARING",
    offsetDays: 30,
    warningDays: 7,
    priority: "HIGH",
    isStatutory: false,
    tracks: ["MUNIMENT_OF_TITLE"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TRUST ADMINISTRATION
// ─────────────────────────────────────────────────────────────────────────────
export const TRUST_ADMIN_DEADLINES: DeadlineRule[] = [
  {
    id: "TRUST_BENEFICIARY_NOTICE",
    title: "Send Notice to Trust Beneficiaries",
    description:
      "The successor trustee must notify all qualified beneficiaries of the trust's existence, right to request a copy, and identity of the trustee. Required in UTC states within 60 days of trust becoming irrevocable.",
    legalBasis: "Uniform Trust Code §813(b); state UTC adoption",
    anchorType: "DOD",
    offsetDays: 60,
    warningDays: 14,
    priority: "CRITICAL",
    isStatutory: true,
    tracks: ["TRUST_ADMIN_REVOCABLE", "TRUST_ADMIN_IRREVOCABLE"],
  },
  {
    id: "TRUST_INVENTORY",
    title: "Complete Trust Asset Inventory",
    description:
      "Successor trustee must identify, inventory, and safeguard all trust assets within 30-60 days of assuming duties.",
    legalBasis: "UTC §810; Restatement (Third) of Trusts §76",
    anchorType: "DOD",
    offsetDays: 60,
    warningDays: 14,
    priority: "HIGH",
    isStatutory: false,
    tracks: ["TRUST_ADMIN_REVOCABLE", "TRUST_ADMIN_IRREVOCABLE"],
  },
  {
    id: "TRUST_CREDITOR_NOTICE",
    title: "Publish Notice to Creditors (Trust)",
    description:
      "Some states allow trustees of revocable trusts to publish a creditor notice to shorten the claim period. Strongly recommended to limit trustee liability.",
    legalBasis: "State-specific — UTC §505; CA Prob. Code §19003",
    anchorType: "DOD",
    offsetDays: 30,
    warningDays: 10,
    priority: "HIGH",
    isStatutory: false,
    tracks: ["TRUST_ADMIN_REVOCABLE"],
  },
  {
    id: "TRUST_CREDITOR_PERIOD",
    title: "Trust Creditor Claim Period Ends",
    description:
      "After publishing notice to creditors of the trust, the claim period begins. After expiration, distributions may proceed.",
    legalBasis: "State specific — CA Prob. Code §19100 (120 days from notice)",
    anchorType: "DOD",
    offsetDays: 150, // 30 days notice + 120 days period
    warningDays: 30,
    priority: "CRITICAL",
    isStatutory: true,
    tracks: ["TRUST_ADMIN_REVOCABLE"],
    stateOverrides: {
      CA: { offsetDays: 150, legalBasis: "CA Prob. Code §19100 — 120 days from published notice" },
    },
  },
  {
    id: "TRUST_ANNUAL_ACCOUNTING",
    title: "First Annual Trust Accounting Due",
    description:
      "The trustee must provide a trust accounting to all qualified beneficiaries at least annually under the UTC and most state trust codes.",
    legalBasis: "UTC §813(c); state trust code",
    anchorType: "DOD",
    offsetDays: 365,
    warningDays: 30,
    priority: "HIGH",
    isStatutory: true,
    tracks: ["TRUST_ADMIN_REVOCABLE", "TRUST_ADMIN_IRREVOCABLE"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SPOUSAL PETITION
// ─────────────────────────────────────────────────────────────────────────────
export const SPOUSAL_PETITION_DEADLINES: DeadlineRule[] = [
  {
    id: "SPOUSAL_PETITION_FILE",
    title: "File Spousal Property Petition (DE-221 / State Equivalent)",
    description:
      "The surviving spouse may file to confirm community/quasi-community property without full probate. File promptly to avoid delays in asset access.",
    legalBasis: "CA Prob. Code §13500; state spousal petition statute",
    anchorType: "DOD",
    offsetDays: 60,
    warningDays: 14,
    priority: "HIGH",
    isStatutory: false,
    tracks: ["SPOUSAL_PETITION"],
  },
  {
    id: "SPOUSAL_DSUE_ELECTION",
    title: "DSUE Portability Election Deadline (Form 706)",
    description:
      "File Form 706 to elect DSUE portability so the surviving spouse can use the deceased spouse's unused estate tax exclusion. Typically 9 months from DOD (extended to 5 years under Rev. Proc. 2022-32 for late elections).",
    legalBasis: "IRC §2010(c)(5)(A); Rev. Proc. 2022-32",
    anchorType: "DOD",
    offsetDays: 274,
    warningDays: 60,
    priority: "HIGH",
    isStatutory: true,
    tracks: ["SPOUSAL_PETITION"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ANCILLARY PROBATE
// ─────────────────────────────────────────────────────────────────────────────
export const ANCILLARY_DEADLINES: DeadlineRule[] = [
  {
    id: "ANCILLARY_FILE",
    title: "File Ancillary Probate in Secondary State",
    description:
      "After receiving certified copies of Letters from the domiciliary (home) state, file ancillary probate in each state where real property is located.",
    legalBasis: "Ancillary state probate code",
    anchorType: "LETTERS",
    offsetDays: 60,
    warningDays: 14,
    priority: "HIGH",
    isStatutory: false,
    tracks: ["ANCILLARY_PROBATE"],
  },
  {
    id: "ANCILLARY_CREDITOR_PERIOD",
    title: "Ancillary State Creditor Claim Period Ends",
    description:
      "Creditor claim period runs independently in each ancillary state based on that state's rules.",
    legalBasis: "Ancillary state probate code — creditor period",
    anchorType: "LETTERS",
    offsetDays: 120, // default; would ideally use ancillary state rule
    warningDays: 30,
    priority: "CRITICAL",
    isStatutory: true,
    tracks: ["ANCILLARY_PROBATE"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MASTER EXPORT — all rules combined, keyed for easy lookup
// ─────────────────────────────────────────────────────────────────────────────
export const ALL_DEADLINE_RULES: DeadlineRule[] = [
  ...UNIVERSAL_DEADLINES,
  ...ESTATE_TAX_DEADLINES,
  ...PROBATE_DEADLINES,
  ...SMALL_ESTATE_DEADLINES,
  ...FL_SUMMARY_DEADLINES,
  ...NY_VOLUNTARY_DEADLINES,
  ...TX_MUNIMENT_DEADLINES,
  ...TRUST_ADMIN_DEADLINES,
  ...SPOUSAL_PETITION_DEADLINES,
  ...ANCILLARY_DEADLINES,
];

/**
 * Returns all DeadlineRules applicable to a given authorityType.
 * Rules with an empty `tracks` array apply to every track.
 */
export function getRulesForTrack(authorityType: string): DeadlineRule[] {
  return ALL_DEADLINE_RULES.filter(
    (rule) => rule.tracks.length === 0 || rule.tracks.includes(authorityType)
  );
}

/**
 * For a given rule and state, returns the effective offsetDays and legalBasis.
 */
export function resolveStateOverride(
  rule: DeadlineRule,
  stateCode: string
): { offsetDays: number; legalBasis: string; title: string } {
  const override = rule.stateOverrides?.[stateCode];
  return {
    offsetDays: override?.offsetDays ?? rule.offsetDays,
    legalBasis: override?.legalBasis ?? rule.legalBasis,
    title: override?.title ?? rule.title,
  };
}
