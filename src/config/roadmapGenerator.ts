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
        return generateTransferOnlyRoadmap(authorityType, state);
    }

    // For Trust Admin, we use a specialized workflow
    if (masterMode === "FIDUCIARY_ADMINISTERED") {
        return generateFiduciaryRoadmap(authorityType, state, modifiers);
    }

    // Default: Court Supervised (Full Probate / Intestate / etc.)
    return generateProbateRoadmap(authorityType, state, modifiers);
}

function generateTransferOnlyRoadmap(type: AuthorityType, state: string): PhaseTaskList[] {
    // Simplified 3-phase roadmap
    const baseline = SETTLEMENT_PHASE_TASKS.filter(p =>
        ["immediate_actions", "asset_discovery", "final_distribution"].includes(p.phase)
    );

    return baseline.map(p => {
        let tasks = [...p.tasks];

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

    return roadmap;
}
