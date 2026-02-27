/**
 * roadmapMetadata.ts
 * 
 * Single Source of Truth for estate settlement roadmap metadata.
 * Unifies phase definitions, canonical ordering, and display copy across the client and server.
 */

export type SettlementPhase = string;

// The canonical, logical ordering of all primary phases
export const PHASE_ORDER: SettlementPhase[] = [
    "immediate_actions",
    "pre_filing_compliance",
    "court_filing",
    "ancillary_phase",
    "litigation_phase",
    "insolvency_phase",
    "asset_discovery",
    "probate_escalation",
    "creditor_claims",
    "asset_liquidation",
    "final_distribution"
];

// ─────────────────────────────────────────────────────────────────────────────
// NJ-specific predicates used in applicability filters across settlementPhases.ts
//
// isNJ               — state === "NJ" (base predicate)
// isNJ_uncontested_surrogate — NJ estate where no contest exists and the
//                     Surrogate has not directed a hearing (standard path).
//                     Citation, serve-citation, and probate/admin hearings are
//                     hidden when this predicate is true.
// isContested        — Estate has been flagged as contested
// surrogate_requires_hearing — Surrogate has explicitly scheduled a hearing
//                     (missing heirs, contested will, bond issues, etc.)
// ─────────────────────────────────────────────────────────────────────────────

// State-specific phase milestone overrides
export const STATE_PHASE_OVERRIDES: Record<string, Record<string, { milestone?: string; subtitle?: string }>> = {
    MA: {
        court_filing: {
            milestone: "Probate & Family Court Filing",
            subtitle: "MUPC Informal/Formal Petition",
        },
        creditor_claims: {
            milestone: "After Authority Issued",
            subtitle: "1-Year Claim Window (4-Month Option)",
        },
    },
    NY: {
        court_filing: {
            milestone: "Surrogate's Court Filing",
            subtitle: "Petition & Letters via Surrogate's Court",
        },
        creditor_claims: {
            milestone: "After Letters Issued",
            subtitle: "7-Month Exposure Management",
        },
    },
    TX: {
        court_filing: {
            milestone: "County/Statutory Probate Court Filing",
            subtitle: "Independent Admin or Muniment of Title",
        },
        creditor_claims: {
            milestone: "After Letters Issued",
            subtitle: "Secured & Unsecured Claims (Optional for Muniment)",
        },
    },
    FL: {
        court_filing: {
            milestone: "Circuit Court Filing",
            subtitle: "Formal Admin or Summary Administration",
        },
        creditor_claims: {
            milestone: "After Notice to Creditors Published",
            subtitle: "3-Month Claim Window (FL Stat. §733.702)",
        },
        final_distribution: {
            milestone: "After Claims & Taxes Addressed",
            subtitle: "Distribution & Homestead Determination",
        },
    },
    GA: {
        court_filing: {
            milestone: "Probate Court Filing",
            subtitle: "Petition for Letters or No Administration Necessary",
        },
        creditor_claims: {
            milestone: "After Letters Issued",
            subtitle: "3-Month Creditor Notice Period",
        },
    },
    CA: {
        creditor_claims: {
            milestone: "After Letters Issued OR Notice Published",
            subtitle: "MAX(4 Months After Letters, 60 Days After Notice) - Prob. Code §9154",
        },
        asset_liquidation: {
            milestone: "After Inventory Prepared",
            subtitle: "IAEA / Court-Confirmed Sales with Overbid",
        },
    },
    NJ: {
        immediate_actions: {
            milestone: "Immediately After Death",
            subtitle: "NJ-Native Initial Assessments",
        },
        pre_filing_compliance: {
            milestone: "Before Surrogate Filing",
            subtitle: "NJ Statutory Eligibility & Venue",
        },
        court_filing: {
            milestone: "County Surrogate's Court Filing",
            subtitle: "Uncontested: Admin Filing → Letters Same Day",
        },
        creditor_claims: {
            milestone: "After First Publication",
            subtitle: "6-Month Claim Window – First Publication (N.J.S.A. 3B:22-4)",
        },
        asset_discovery: {
            milestone: "After Letters Issued",
            subtitle: "Inventory Due Within 90 Days (N.J.S.A. 3B:15-1)",
        },
        asset_liquidation: {
            milestone: "After Inventory Filed",
            subtitle: "Power of Sale or Court Confirmation",
        },
        final_distribution: {
            milestone: "After Tax Waivers Received",
            subtitle: "Class A: Exempt | Class C/D: Waiver Required",
        },
    },
};

// State-neutral defaults for phases (used when no state override exists)
export const NEUTRAL_PHASE_MILESTONES: Record<string, { milestone: string; subtitle: string }> = {
    immediate_actions: { milestone: "Immediately After Death", subtitle: "Secure, Notify, Preserve" },
    pre_filing_compliance: { milestone: "Before Court Filing", subtitle: "Eligibility, Venue, Parties" },
    court_filing: { milestone: "Court Filing → Authority", subtitle: "Petition, Notices, Letters" },
    ancillary_phase: { milestone: "After Primary Filing", subtitle: "Out-of-State Process" },
    litigation_phase: { milestone: "Ongoing", subtitle: "Will Contests & Disputes" },
    insolvency_phase: { milestone: "Immediate Risk Action", subtitle: "Priority Debt Shield" },
    asset_discovery: { milestone: "After Authority Issued", subtitle: "Inventory & Valuation" },
    probate_escalation: { milestone: "Triggered Exception", subtitle: "Formal Court Review" },
    creditor_claims: { milestone: "After Authority Issued", subtitle: "Claims & Exposure Management" },
    asset_liquidation: { milestone: "After Inventory Prepared", subtitle: "Transfers & Sales (If Needed)" },
    final_distribution: { milestone: "After Claims & Taxes Addressed", subtitle: "Accounting, Distribution, Close" },
};
