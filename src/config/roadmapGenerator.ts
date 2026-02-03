import { AuthorityType, MasterMode, getMasterMode } from "@/lib/authorityEngine";
import { PhaseTaskList, SETTLEMENT_PHASE_TASKS } from "./settlementPhases";
import { SettlementPhase } from "@/components/SettlementPhaseChevron";

export function generateRoadmap(
    authorityType: AuthorityType,
    state: string,
    modifiers: string[] = []
): PhaseTaskList[] {
    const masterMode = getMasterMode(authorityType);

    // For simplest cases (Transfer Only), we use a reduced phase set
    if (masterMode === "TRANSFER_ONLY") {
        return generateTransferOnlyRoadmap(authorityType, state, modifiers);
    }

    // For Trust Admin, we use a specialized workflow
    if (masterMode === "FIDUCIARY_ADMINISTERED") {
        return generateFiduciaryRoadmap(authorityType, state, modifiers);
    }

    // Discovery mode
    if (authorityType === "DISCOVERY") {
        return generateDiscoveryRoadmap(authorityType, state);
    }

    // Default: Court Supervised (Full Probate / Intestate / etc.)
    return generateProbateRoadmap(authorityType, state, modifiers);
}

function generateTransferOnlyRoadmap(type: AuthorityType, state: string, modifiers: string[] = []): PhaseTaskList[] {
    // Simplified 3-phase roadmap
    const baseline = SETTLEMENT_PHASE_TASKS.filter(p =>
        ["immediate_actions", "asset_discovery", "final_distribution"].includes(p.phase)
    );

    return baseline.map(p => {
        let tasks = [...p.tasks];

        // Filter out international tasks if modifier is not present
        if (!modifiers.includes("INTERNATIONAL_MODE")) {
            tasks = tasks.filter(t => !t.isInternationalOnly);
        }

        // Filter tasks that are purely probate-related
        tasks = tasks.filter(t => t.category !== "probate");

        // Add specific task for the transfer type
        if (type === "SMALL_ESTATE") {
            tasks.push({
                id: "prepare_affidavit",
                title: "Prepare Small Estate Affidavit",
                description: `Draft the ${state} Small Estate Affidavit to transfer assets without court.`,
                estimatedTime: "1-2 hours",
                alerts: [{ type: "info", message: "Most banks require a 40-day waiting period from date of death." }]
            });
        }

        if (type === "JOINT_TRANSFER") {
            tasks.push({
                id: "transfer_joint_assets",
                title: "Transfer Jointly Owned Assets",
                description: "Submit death certificates to financial institutions to remove decedent from joint accounts.",
                estimatedTime: "2-3 weeks"
            });
        }

        return { ...p, tasks };
    });
}

function generateFiduciaryRoadmap(type: AuthorityType, state: string, modifiers: string[]): PhaseTaskList[] {
    // 4-phase roadmap: Immediate, Discovery, Administration, Closing
    const phases: SettlementPhase[] = ["immediate_actions", "asset_discovery", "asset_liquidation", "final_distribution"];
    const baseline = SETTLEMENT_PHASE_TASKS.filter(p => phases.includes(p.phase));

    return baseline.map(p => {
        let tasks = [...p.tasks];

        // Filter out international tasks if modifier is not present
        if (!modifiers.includes("INTERNATIONAL_MODE")) {
            tasks = tasks.filter(t => !t.isInternationalOnly);
        }

        // Remove court-filing specific tasks
        tasks = tasks.filter(t => t.category !== "probate" && t.category !== "court-issued");

        if (p.phase === "immediate_actions" && (type === "TRUST_ADMIN_REVOCABLE" || type === "TRUST_ADMIN_IRREVOCABLE" || type === "POUR_OVER_WILL")) {
            tasks.push({
                id: "issue_cert_trust_gen",
                title: "Issue Certificate of Trust",
                description: "Prepare and notarize a Certificate of Trust to present successor trustee authority to banks.",
                estimatedTime: "1 hour"
            });
        }

        if (modifiers.includes("INSOLVENT")) {
            tasks.push({
                id: "insolvency_prioritization",
                title: "Strict Liability Prioritization",
                description: "Estate is insolvent. Do not pay any creditors until priority order is legally confirmed.",
                alerts: [{ type: "caution", message: "Personal liability risk: Paying a low-priority debt before a high-priority one may require you to pay back the estate." }]
            });
        }

        if (modifiers.includes("BUSINESS_ESTATE")) {
            if (p.phase === "immediate_actions") {
                tasks.push({
                    id: "business_operating_authority",
                    title: "Establish Business Operating Authority",
                    description: "Confirm legal authority to continue business operations to avoid loss of value.",
                    tags: ["risk-guardrail"]
                });
            }
            if (p.phase === "asset_discovery") {
                tasks.push({
                    id: "business_valuation",
                    title: "Order Professional Business Valuation",
                    description: "Obtain a formal appraisal of the business interest as of the date of death.",
                    tags: ["fiduciary"]
                });
            }
        }

        if (modifiers.includes("MINOR_HEIRS")) {
            if (p.phase === "final_distribution") {
                tasks.push({
                    id: "minor_distribution_block",
                    title: "Establish Blocked Accounts for Minors",
                    description: "Distributions to minors must be held in court-approved blocked accounts or trusts.",
                    alerts: [{ type: "important", message: "Do NOT distribute directly to a minor. This is a violation of probate law." }]
                });
            }
        }

        if (modifiers.includes("UNCLAIMED_PROPERTY") && p.phase === "asset_discovery") {
            tasks.push({
                id: "search_state_unclaimed",
                title: "Search State Unclaimed Property",
                description: "Check state controller databases for forgotten accounts or safe deposit boxes.",
                tags: ["fiduciary"]
            });
        }

        if (modifiers.includes("CONTESTED")) {
            tasks.unshift({
                id: "litigation_hold",
                title: "LITIGATION HOLD: Distribution Freeze",
                description: "Estate is contested. Do not distribute any assets or pay non-essential claims without court order.",
                alerts: [{ type: "caution", message: "Personal liability risk: Distributions during a contest may be clawed back or surcharge the fiduciary." }]
            });
        }

        return { ...p, tasks };
    });
}

function generateProbateRoadmap(type: AuthorityType, state: string, modifiers: string[]): PhaseTaskList[] {
    // Full 6-phase roadmap
    let roadmap = JSON.parse(JSON.stringify(SETTLEMENT_PHASE_TASKS));

    // State-specific overrides
    if (state === "TX" && type === "MUNIMENT_OF_TITLE") {
        // Modify roadmap for Muniment of Title (reduced administration)
        roadmap = roadmap.map((p: PhaseTaskList) => {
            if (p.phase === "creditor_claims" || p.phase === "asset_liquidation") {
                return { ...p, tasks: p.tasks.filter(t => !t.id.includes("accounting") && !t.id.includes("letters")) };
            }
            return p;
        });
    }

    // FL Summary Administration (Reduced 3-phase path)
    if (state === "FL" && type === "SMALL_ESTATE") {
        return roadmap.filter((p: PhaseTaskList) =>
            ["immediate_actions", "asset_discovery", "final_distribution"].includes(p.phase)
        ).map((p: PhaseTaskList) => {
            let tasks = [...p.tasks];
            if (p.phase === "immediate_actions") {
                tasks.push({
                    id: "file_summary_petition",
                    title: "File Petition for Summary Administration",
                    description: "For FL estates < $75k, file this petition to bypass full formal probate.",
                    category: "probate"
                });
            }
            return { ...p, tasks };
        });
    }

    // Handle Ancillary Probate
    if (type === "ANCILLARY_PROBATE") {
        const courtFiling = roadmap.find((p: any) => p.phase === "court_filing");
        if (courtFiling) {
            courtFiling.tasks.unshift({
                id: "ancillary_filing",
                title: "File Ancillary Probate in " + state,
                description: "Open a secondary probate case in the state where the real property is located.",
                category: "probate",
                requiredDocs: ["Certified Letters from Home State", "Authenticated Will"]
            });
        }
    }

    // Handle Spousal Petitions
    if (type === "SPOUSAL_PETITION") {
        // CAUTION: Do NOT skip creditor claims without explicit legal evidence.
        // Instead, we add a high-priority task to verify the 'Spousal Set-Aside' requirements.
        const creditorPhase = roadmap.find((p: any) => p.phase === "creditor_claims");
        if (creditorPhase) {
            creditorPhase.tasks.unshift({
                id: "verify_spousal_creditor_exemption",
                title: "Verify Creditor Notice Exemption",
                description: "Surviving spouses may be exempt from standard creditor notice if they assume personal liability for decedent's debts.",
                tags: ["risk-guardrail", "statutory"],
                alerts: [{
                    type: "warning",
                    message: "Assuming liability is high-risk. While it skips the 4-month waiting period, you become personally responsible for the debts out of your own pocket."
                }],
                links: [{ label: "CA Prob. Code §13550", url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=13550.&lawCode=PROB" }]
            });
        }
    }

    // Inject Overlays for Probate
    return roadmap.map((p: PhaseTaskList) => {
        let tasks = [...p.tasks];

        // Filter out international tasks if modifier is not present
        if (!modifiers.includes("INTERNATIONAL_MODE")) {
            tasks = tasks.filter(t => !t.isInternationalOnly);
        }

        if (modifiers.includes("INSOLVENT") && p.phase === "creditor_claims") {
            tasks.unshift({
                id: "insolvency_freeze",
                title: "Insolvency ALERT: Freeze Distributions",
                description: "Estate liabilities exceed assets. DO NOT pay any debts or distribute any assets.",
                alerts: [{ type: "caution", message: "Contact legal counsel immediately for a pro-rata distribution plan." }]
            });
        }

        if (modifiers.includes("BUSINESS_ESTATE")) {
            if (p.phase === "court_filing") {
                tasks.push({
                    id: "petition_operating_orders",
                    title: "Petition for Business Operating Orders",
                    description: "Ask the court for explicit permission to continue decedent's business operations.",
                    category: "probate"
                });
            }
            if (p.phase === "asset_discovery") {
                tasks.push({
                    id: "business_appraisal",
                    title: "Conduct Business Valuation",
                    description: "Engage a certified appraiser to determine the value of decedent's business stake.",
                    tags: ["statutory"]
                });
            }
        }

        if (modifiers.includes("MINOR_HEIRS") && p.phase === "final_distribution") {
            tasks.unshift({
                id: "minor_distribution_petition",
                title: "Petition for Minor Distribution Approval",
                description: "File to have the court approve the guardian or trustee for minor's inheritance.",
                alerts: [{ type: "important", message: "Distributions to minors require strict court oversight." }]
            });
        }

        if (modifiers.includes("CONTESTED")) {
            tasks.unshift({
                id: "litigation_hold_probate",
                title: "LITIGATION HOLD: Freeze Distributions",
                description: "Will contest or heirship dispute detected. Assets must remain in the estate account until resolved.",
                alerts: [{ type: "caution", message: "Consult with estate litigation counsel before taking any non-routine actions." }]
            });
        }

        if (modifiers.includes("ELECTIVE_SHARE") && p.phase === "creditor_claims") {
            tasks.push({
                id: "elective_share_calc",
                title: "Spousal Elective Share Calculation",
                description: "A spouse has asserted an elective share claim. Recalculate distribution priorities accordingly.",
                tags: ["fiduciary"]
            });
        }

        if (modifiers.includes("UNCLAIMED_PROPERTY") && p.phase === "asset_discovery") {
            tasks.push({
                id: "search_state_unclaimed_probate",
                title: "Search State Unclaimed Property",
                description: "Check state controller databases for dormant accounts or forgotten insurance policies.",
                tags: ["fiduciary"]
            });
        }

        return { ...p, tasks };
    });
}

function generateDiscoveryRoadmap(type: AuthorityType, state: string): PhaseTaskList[] {
    const baseline = SETTLEMENT_PHASE_TASKS.filter(p =>
        ["immediate_actions", "asset_discovery"].includes(p.phase)
    );

    return baseline.map(p => {
        let tasks = [...p.tasks];
        if (p.phase === "immediate_actions") {
            tasks.unshift({
                id: "initial_search_protocol",
                title: "Initialize Forensic Discovery Protocol",
                description: "Estate track is unknown. Begin systematic asset search to calibrate the correct legal path.",
                category: "probate"
            });
        }
        return { ...p, tasks };
    });
}
