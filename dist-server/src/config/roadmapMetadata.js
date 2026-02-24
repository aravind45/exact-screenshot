/**
 * roadmapMetadata.ts
 *
 * Single Source of Truth for estate settlement roadmap metadata.
 * Unifies phase definitions, canonical ordering, and display copy across the client and server.
 */
// The canonical, logical ordering of all primary phases
export const PHASE_ORDER = [
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
// State-specific phase milestone overrides
export const STATE_PHASE_OVERRIDES = {
    NY: {
        creditor_claims: {
            milestone: "After Letters Issued",
            subtitle: "7-Month Exposure Management",
        },
    },
    CA: {
        creditor_claims: {
            milestone: "After Notice Published",
            subtitle: "4-Month Claim Window",
        },
        asset_liquidation: {
            milestone: "After Inventory Prepared",
            subtitle: "IAEA / Court-Confirmed Sales",
        },
    },
};
// State-neutral defaults for phases (used when no state override exists)
export const NEUTRAL_PHASE_MILESTONES = {
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
