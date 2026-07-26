import { AuthorityType, MasterMode, getMasterMode } from "@/lib/authorityEngine";
import { getLettersTerm, getStateRule } from "@/lib/stateRules";
import { PhaseTask, PhaseTaskList, SETTLEMENT_PHASE_TASKS, TRUST_PHASE_TASKS, MODIFIER_PHASE_TASKS, PROBATE_ESCALATION_PHASE } from "./settlementPhases";
import { SettlementPhase, PHASE_ORDER, STATE_PHASE_OVERRIDES, NEUTRAL_PHASE_MILESTONES } from "./roadmapMetadata";
import { filterPhasesByJurisdiction } from "@/shared/filterByJurisdiction";

// ─────────────────────────────────────────────────────────────────────────────
// CA-only task IDs that must NEVER appear for non-CA states.
// Synced with server/services/roadmapService.ts CA_ONLY_TASK_IDS.
// ─────────────────────────────────────────────────────────────────────────────
const CA_ONLY_TASK_IDS = new Set([
    "prepare_notice_proposed_action",
    "wait_proposed_action_period",
    "petition_confirm_sale",
    "obtain_sale_confirmation_order",
]);

// ─────────────────────────────────────────────────────────────────────────────
// GA-only task IDs that must NEVER appear for non-GA states.
// Georgia ultra-minimal cleanup: hide spousal/succession petitions and generic creditor placeholder
// ─────────────────────────────────────────────────────────────────────────────
const GA_ONLY_TASK_IDS = new Set([
    "ga_years_support_petition",
    "ga_years_support_citation",
    "ga_years_support_order",
    "file_ga_no_admin",
]);

// ─────────────────────────────────────────────────────────────────────────────
// NY-only task IDs that must NEVER appear for non-NY states.
// New York Surrogate's Court specific tasks
// ─────────────────────────────────────────────────────────────────────────────
const NY_ONLY_TASK_IDS = new Set([
    "ny_probate_petition",
    "ny_admin_petition",
    "ny_voluntary_admin",
    "ny_ancillary_petition",
    "ny_small_estate_affidavit",
    "ny_surrogate_appointment",
    "ny_accounting",
]);

// ─────────────────────────────────────────────────────────────────────────────
// TX-only task IDs that must NEVER appear for non-TX states.
// Texas-specific probate tasks
// ─────────────────────────────────────────────────────────────────────────────
const TX_ONLY_TASK_IDS = new Set([
    "tx_muniment_title",
    "tx_independent_administration",
    "tx_dependent_administration",
    "tx_heirship_proceeding",
    "tx_posting_requirement",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Tasks to EXCLUDE for specific states (State Isolation)
// ─────────────────────────────────────────────────────────────────────────────
const GA_EXCLUDED_TASK_IDS = new Set([
    "file_spousal_petition",
    "give_spousal_notice",
    "obtain_spousal_order",
    "file_succession_petition",
    "give_succession_notice",
    "obtain_succession_order",
    "wait_claim_period",
]);

const OH_EXCLUDED_TASK_IDS = new Set([
    "file_spousal_petition",
    "give_spousal_notice",
    "obtain_spousal_order",
    "file_succession_petition",
    "give_succession_notice",
    "obtain_succession_order",
]);

const NY_EXCLUDED_TASK_IDS = new Set([
    // NY doesn't have spousal succession - use different process
    "file_spousal_petition",
    "give_spousal_notice",
    "obtain_spousal_order",
]);

const TX_EXCLUDED_TASK_IDS = new Set([
    // TX has unique administration types - exclude generic ones
    "file_administration_petition",
]);

// ─────────────────────────────────────────────────────────────────────────────
// State-specific title patterns to exclude (contamination prevention)
// ─────────────────────────────────────────────────────────────────────────────
const CA_ONLY_TITLE_PATTERNS = [
    /\bNotice of Proposed Action\b/i,
    /\b15-Day Objection Period\b/i,
    /\bPetition to Confirm Sale\b/i,
    /\bSale Confirmation Order\b/i,
    /\bIAEA\b/,
    /\bIndependent Administration\b/i,
];

const NY_ONLY_TITLE_PATTERNS = [
    /\bSurrogate'?s?\s+Court\b/i,
    /\bSCPA\b/i,
    /\bVoluntary Administration\b/i,
    /\bLetters of Authority\b/i,
];

const TX_ONLY_TITLE_PATTERNS = [
    /\bMuniment of Title\b/i,
    /\bIndependent Administration\b/i,
    /\bEstates Code\b/i,
];

// ─────────────────────────────────────────────────────────────────────────────
// (Overrides and Neutral milestones now imported from roadmapMetadata)
// ─────────────────────────────────────────────────────────────────────────────

function normalizeTextForState(text: string | undefined, state: string): string | undefined {
    if (!text) return text;
    // Don't normalize for CA - it has its own specific terminology
    if (state === "CA") return text;

    const lettersTerm = getLettersTerm(state);
    let out = text;

    // Generic letter terminology normalization
    out = out.replace(/\bCertified Letters\s*\(DE-\d+\)/gi, `Certified ${lettersTerm}`);
    out = out.replace(/\bLetters Testamentary\s*\(DE-\d+\)/gi, lettersTerm);
    out = out.replace(/\bLetters of Authority\s*\(DE-\d+\)/gi, lettersTerm);
    out = out.replace(/\bLetters\s*\(DE-\d+\)/gi, lettersTerm);

    // Remove form reference numbers
    out = out.replace(/\s*\(DE-\d+\)/gi, "");
    out = out.replace(/\bDE-\d+\b/gi, "");

    // CA-specific replacements (for contamination cleanup)
    // NOTE: Medi-Cal/DHCS are California-specific programs. Erasing them into
    // generic "Medicaid" would hide a mandatory estate-recovery gate from
    // California users. Preserve the terms; only neutralize for non-CA states
    // that have their own recovery program names.
    out = out.replace(/\bCalifornia Probate Code\b/gi, "State probate code");
    out = out.replace(/\bCA Prob\. Code\b/gi, "State probate code");
    out = out.replace(/\bCalifornia law\b/gi, "State law");
    out = out.replace(/\bCalifornia\b/gi, "state");
    out = out.replace(/\bCA\b/g, "state");
    // Medi-Cal estate recovery applies in every state under a different
    // program name (Medicaid estate recovery / MERP); keep the concept intact.
    out = out.replace(/\bMedi-Cal\b/gi, "Medicaid estate recovery");
    out = out.replace(/\bDHCS\b/gi, "the state Medicaid agency");

    // NY-specific replacements (for contamination cleanup)
    out = out.replace(/\bSurrogate'?s?\s+Court\b/gi, "Probate Court");
    out = out.replace(/\bSCPA\b/gi, "State probate code");
    out = out.replace(/\bNY Surrogate\b/gi, "Probate Court");
    out = out.replace(/\bNew York\s+Probate\b/gi, "State probate");

    // TX-specific replacements
    out = out.replace(/\bEstates Code\b/gi, "State Estates Code");
    out = out.replace(/\bTexas\s+Probate\b/gi, "State probate");

    // Generic state replacements
    out = out.replace(/\s{2,}/g, " ").trim();
    return out;
}

function normalizeTaskForState(task: PhaseTask, state: string): PhaseTask {
    const override = task.stateOverrides?.[state];
    const mergedTask = override ? { ...task, ...override } : task;

    // Clean CA-only dependencies for non-CA states
    if (state !== "CA" && mergedTask.dependencies) {
        mergedTask.dependencies = mergedTask.dependencies.filter(
            (dep: string) => !CA_ONLY_TASK_IDS.has(dep)
        );
    }

    return {
        ...mergedTask,
        title: normalizeTextForState(mergedTask.title, state) || "",
        description: normalizeTextForState(mergedTask.description, state) || "",
        utility: normalizeTextForState(mergedTask.utility, state),
        rationale: normalizeTextForState(mergedTask.rationale, state),
        requiredDocs: mergedTask.requiredDocs?.map((doc: string) => normalizeTextForState(doc, state) || "") ?? mergedTask.requiredDocs,
        alerts: mergedTask.alerts?.map((alert) => ({
            ...alert,
            message: normalizeTextForState(alert.message, state) || ""
        })) ?? mergedTask.alerts,
        links: mergedTask.links?.map((link) => ({
            ...link,
            label: normalizeTextForState(link.label, state) || ""
        })) ?? mergedTask.links
    };
}

/**
 * Hard guard: remove CA-only tasks for non-CA states (client-side version).
 * Uses task-ID, applicability.states, AND title-pattern matching.
 */
function removeCAOnlyTasks(phases: PhaseTaskList[], state: string): PhaseTaskList[] {
    if (state === "CA") return phases;
    return phases.map(phase => ({
        ...phase,
        tasks: phase.tasks.filter(task => {
            if (CA_ONLY_TASK_IDS.has(task.id)) return false;
            if (task.applicability?.states?.length && !task.applicability.states.includes(state)) return false;
            if (CA_ONLY_TITLE_PATTERNS.some(p => p.test(task.title))) return false;
            return true;
        }),
    }));
}

/**
 * Hard guard: remove state-excluded tasks (State Isolation).
 */
function removeStateExcludedTasks(phases: PhaseTaskList[], state: string): PhaseTaskList[] {
    return phases.map(phase => ({
        ...phase,
        tasks: phase.tasks.filter(task => {
            // GA-excluded tasks
            if (state === "GA" && GA_EXCLUDED_TASK_IDS.has(task.id)) return false;
            // OH-excluded tasks (CA module removals)
            if (state === "OH" && OH_EXCLUDED_TASK_IDS.has(task.id)) return false;
            // NY-excluded tasks (NY has different process)
            if (state === "NY" && NY_EXCLUDED_TASK_IDS.has(task.id)) return false;
            // TX-excluded tasks (TX has unique administration)
            if (state === "TX" && TX_EXCLUDED_TASK_IDS.has(task.id)) return false;

            // GA-only tasks should ONLY show for GA state
            if (GA_ONLY_TASK_IDS.has(task.id)) return state === "GA";
            // NY-only tasks should ONLY show for NY state
            if (NY_ONLY_TASK_IDS.has(task.id)) return state === "NY";
            // TX-only tasks should ONLY show for TX state
            if (TX_ONLY_TASK_IDS.has(task.id)) return state === "TX";

            return true;
        }),
    }));
}

function isTaskExcludedForState(task: PhaseTask, state: string): boolean {
    // State-specific exclusions
    if (state === "GA" && GA_EXCLUDED_TASK_IDS.has(task.id)) return true;
    if (state === "OH" && OH_EXCLUDED_TASK_IDS.has(task.id)) return true;
    if (state === "NY" && NY_EXCLUDED_TASK_IDS.has(task.id)) return true;
    if (state === "TX" && TX_EXCLUDED_TASK_IDS.has(task.id)) return true;

    // State-only tasks should only appear for their specific state
    if (state !== "CA" && CA_ONLY_TASK_IDS.has(task.id)) return true;
    if (state !== "GA" && GA_ONLY_TASK_IDS.has(task.id)) return true;
    if (state !== "NY" && NY_ONLY_TASK_IDS.has(task.id)) return true;
    if (state !== "TX" && TX_ONLY_TASK_IDS.has(task.id)) return true;

    // Reject generic state-specific titles for other states
    if (state !== "CA" && CA_ONLY_TITLE_PATTERNS.some(p => p.test(task.title))) {
        return true;
    }
    if (state !== "NY" && NY_ONLY_TITLE_PATTERNS.some(p => p.test(task.title))) {
        return true;
    }
    if (state !== "TX" && TX_ONLY_TITLE_PATTERNS.some(p => p.test(task.title))) {
        return true;
    }

    return false;
}

function processPhase(phaseTasks: PhaseTask[], state: string): PhaseTask[] {
    return phaseTasks
        .filter((task: PhaseTask) => !isTaskExcludedForState(task, state))
        .map((task: PhaseTask) => normalizeTaskForState(task, state));
}

/**
 * Normalize phase-level metadata for the estate's state (client-side version).
 * Resolution order: stateOverrides[state] → DEFAULT → NEUTRAL_PHASE_MILESTONES → original
 */
function normalizePhasesForState(phases: PhaseTaskList[], state: string): PhaseTaskList[] {
    const stateOverrides = STATE_PHASE_OVERRIDES[state] || {};
    return phases.map(phase => {
        const phaseOverride = stateOverrides[phase.phase];
        const neutralDefault = NEUTRAL_PHASE_MILESTONES[phase.phase];
        return {
            ...phase,
            milestone: phaseOverride?.milestone || neutralDefault?.milestone || phase.milestone,
            subtitle: phaseOverride?.subtitle || neutralDefault?.subtitle || phase.subtitle,
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// State contamination validator: flags state-specific tokens in non-matching roadmaps.
// Called at the end of generateRoadmap() in development to catch any leaks.
// ─────────────────────────────────────────────────────────────────────────────
const CA_CONTAMINATION_TOKENS = [
    "Notice of Proposed Action",
    "15-Day Objection",
    "Petition to Confirm Sale",
    "Sale Confirmation Order",
    "4-Month Claim Period",
    "IAEA",
];

const NY_CONTAMINATION_TOKENS = [
    "Surrogate's Court",
    "SCPA",
    "Voluntary Administration",
    "Letters of Authority",
    "Surrogate",
];

const TX_CONTAMINATION_TOKENS = [
    "Muniment of Title",
    "Independent Administration",
    "Estates Code",
    "10-Day Posting",
];

function validateNoStateContamination(phases: PhaseTaskList[], state: string): void {
    // Get the appropriate token list for this state
    const getTokensForState = (s: string): string[] => {
        switch (s) {
            case "CA": return [];
            case "NY": return NY_CONTAMINATION_TOKENS;
            case "TX": return TX_CONTAMINATION_TOKENS;
            default: return [...CA_CONTAMINATION_TOKENS, ...NY_CONTAMINATION_TOKENS, ...TX_CONTAMINATION_TOKENS];
        }
    };
    
    const stateSpecificTokens = getTokensForState(state);
    const warnings: string[] = [];
    
    for (const phase of phases) {
        // Check phase-level metadata
        for (const token of stateSpecificTokens) {
            if (phase.milestone?.includes(token) || phase.subtitle?.includes(token)) {
                warnings.push(`[PHASE "${phase.phase}"] ${state} token "${token}" found in milestone/subtitle`);
            }
        }
        // Check task-level content
        for (const task of phase.tasks) {
            for (const token of stateSpecificTokens) {
                const fields = [task.title, task.description, task.utility, task.rationale];
                for (const field of fields) {
                    if (field?.includes(token)) {
                        warnings.push(`[TASK "${task.id}"] ${state} token "${token}" found in field content`);
                    }
                }
            }
        }
    }
    if (warnings.length > 0) {
        console.warn(`⚠️ STATE CONTAMINATION DETECTED for state=${state}:\n${warnings.join("\n")}`);
    }
}

let _clientGenWarnedOnce = false;

export function generateRoadmap(
    authorityType: AuthorityType,
    state: string,
    modifiers: string[] = [],
    activeEngines: string[] = [],
    hasWill?: boolean
): PhaseTaskList[] {
    // PRODUCTION GUARD: Client-side generation is deprecated in favor of server SSOT.
    // In production, components should use GET /api/estates/:id/roadmap instead.
    if (import.meta.env.PROD && !_clientGenWarnedOnce) {
        console.warn(
            "[DEPRECATION] generateRoadmap() called in production. " +
            "Use GET /api/estates/:id/roadmap for the canonical server-authoritative roadmap. " +
            "Client-side generation will be removed in a future release."
        );
        _clientGenWarnedOnce = true;
    }

    const masterMode = getMasterMode(authorityType);

    // If no active engines provided, infer them from authorityType for backwards compatibility
    const engines = activeEngines.length > 0 ? activeEngines : [
        masterMode === "TRANSFER_ONLY" ? "NON_PROBATE" :
            masterMode === "FIDUCIARY_ADMINISTERED" ? "TRUST" : "PROBATE"
    ];

    const allRoadmaps: PhaseTaskList[][] = [];

    // Order of pushing determines "Identity Winning" priority.
    // If court-supervised, Probate should be primary to avoid trust-first bias.
    const probateFirst = masterMode === "COURT_SUPERVISED";

    if (probateFirst) {
        if (engines.includes("PROBATE") || engines.includes("AFFIDAVIT")) {
            allRoadmaps.push(generateProbateRoadmap(authorityType, state, modifiers, engines, hasWill));
        }
        if (engines.includes("TRUST")) {
            allRoadmaps.push(generateFiduciaryRoadmap(authorityType, state, modifiers, engines, hasWill));
        }
        if (engines.includes("NON_PROBATE") || engines.includes("TOD_DEED") || engines.includes("POD_TOD_ACCOUNTS")) {
            allRoadmaps.push(generateTransferOnlyRoadmap(authorityType, state, modifiers, engines, hasWill));
        }
    } else {
        if (engines.includes("TRUST")) {
            allRoadmaps.push(generateFiduciaryRoadmap(authorityType, state, modifiers, engines, hasWill));
        }
        if (engines.includes("NON_PROBATE") || engines.includes("TOD_DEED") || engines.includes("POD_TOD_ACCOUNTS")) {
            allRoadmaps.push(generateTransferOnlyRoadmap(authorityType, state, modifiers, engines, hasWill));
        }
        if (engines.includes("PROBATE") || engines.includes("AFFIDAVIT")) {
            allRoadmaps.push(generateProbateRoadmap(authorityType, state, modifiers, engines, hasWill));
        }
    }

    if (authorityType === "DISCOVERY" || engines.includes("DISCOVERY")) {
        allRoadmaps.push(generateDiscoveryRoadmap(authorityType, state, hasWill));
    }

    // Merge roadmaps by phase with identity winning (The primary track's metadata wins)
    const mergedPhases: Record<string, PhaseTaskList> = {};

    allRoadmaps.forEach((roadmap, roadmapIndex) => {
        // We assume the first engine in activeEngines is the "Primary" one
        // and its roadmap was pushed first or second.
        // Actually, let's use a simpler heuristic: engines added LATER in allRoadmaps 
        // will attempt to merge tasks, but we want the FIRST engine's metadata to stick.
        roadmap.forEach(phaseList => {
            if (!mergedPhases[phaseList.phase]) {
                mergedPhases[phaseList.phase] = { ...phaseList, tasks: [...phaseList.tasks] };
            } else {
                // Merge tasks, avoiding duplicates
                const existingIds = new Set(mergedPhases[phaseList.phase].tasks.map(t => t.id));
                phaseList.tasks.forEach(task => {
                    if (!existingIds.has(task.id)) {
                        mergedPhases[phaseList.phase].tasks.push(task);
                    }
                });

                // IDENTITY WINNING: Allow "Fiduciary" tracks to override basic probate titles
                // if they are merged into the same phase key.
                if (masterMode === "FIDUCIARY_ADMINISTERED" && roadmapIndex === 0) {
                    // This is already handled by the "if (!mergedPhases[phaseList.phase])" block
                    // being the first one to set the metadata.
                }
            }
        });
    });

    // Order phases properly based on canonical sequence
    const orderedPhaseKeys: SettlementPhase[] = PHASE_ORDER;

    // Build final phase list with per-task normalization
    let finalPhases = orderedPhaseKeys
        .filter(key => mergedPhases[key])
        .map(key => ({
            ...mergedPhases[key],
            tasks: mergedPhases[key].tasks.map(task => normalizeTaskForState(task, state))
        }));

    // Apply unified jurisdiction filter (fail-closed scope check)
    const { phases: scopeFiltered, dropped } = filterPhasesByJurisdiction(finalPhases, state);
    if (dropped.length > 0 && typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
        console.warn(`[roadmapGenerator] Dropped ${dropped.length} tasks for state ${state}:`, dropped.map(d => `${d.id}: ${d.reason}`));
    }
    finalPhases = scopeFiltered as unknown as PhaseTaskList[];

    // Legacy guards (defense-in-depth until scope migration is 100% complete)
    finalPhases = removeCAOnlyTasks(finalPhases, state);
    finalPhases = removeStateExcludedTasks(finalPhases, state);
    finalPhases = normalizePhasesForState(finalPhases, state);

    // Development-time contamination check
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
        validateNoStateContamination(finalPhases, state);
    }

    return finalPhases;
}

function generateTransferOnlyRoadmap(type: AuthorityType, state: string, modifiers: string[] = [], activeEngines: string[] = [], hasWill?: boolean): PhaseTaskList[] {
    const isTOD = type === "TOD_DEED";

    // 5-State Attorney Model for TOD
    // 1. Eligibility Validation
    // 2. Beneficiary Authority
    // 3. Title Transfer
    // 4. Creditor Exposure Review
    // 5. Exception Escalation

    const phaseKeys: SettlementPhase[] = isTOD
        ? ["immediate_actions", "asset_discovery", "creditor_claims", "asset_liquidation"]
        : ["immediate_actions", "asset_discovery", "final_distribution"];

    const baseline = SETTLEMENT_PHASE_TASKS.filter(p => phaseKeys.includes(p.phase));

    const roadmap = baseline.map(p => {
        let tasks = [...p.tasks];

        // Filter out international tasks if modifier is not present
        if (!modifiers.includes("INTERNATIONAL_MODE")) {
            tasks = tasks.filter(t => !t.isInternationalOnly);
        }

        const trackTag = isTOD ? "NON_PROBATE" : "AFFIDAVIT";
        tasks = tasks.filter(t =>
            t.category !== "probate" &&
            (!t.trackCompatibility || t.trackCompatibility.includes(trackTag as "AFFIDAVIT" | "NON_PROBATE")) &&
            (!t.applicability?.states || t.applicability.states.includes(state)) &&
            (!t.applicability?.excludePredicates?.includes(`is${state}`))
        );

        // STRIP AUTHORITY REQUIREMENT: In TOD/Transfer tracks, court-issued Letters are NOT the default.
        tasks = tasks.map(t => ({ ...t, requiresAuthority: false }));

        if (isTOD) {
            if (p.phase === "immediate_actions") {
                // Focus on State 1 & State 2: Selection of only critical assessment + TOD validation
                tasks = tasks.filter(t =>
                    ["preliminary_asset_scan", "secure_property_2", "check_tod_recordation",
                        "check_tod_revocation", "check_beneficiary_survival", "check_joint_tenancy_override",
                        "prepare_beneficiary_authority_packet", "escalate_to_probate_trigger"
                    ].includes(t.id)
                );
            }
            if (p.phase === "asset_discovery") {
                // State 5 Escalation logic placeholder or additional verification
                tasks = tasks.filter(t => t.id === "confirm_tod_deed_validity");
            }
            if (p.phase === "creditor_claims") {
                // State 4: Silent Creditor Review
                tasks = tasks.filter(t => t.id === "tod_creditor_review");
            }
            if (p.phase === "asset_liquidation") {
                // State 3: Title Transfer Workflow
                tasks = tasks.filter(t =>
                    ["record_affidavit_of_death", "notify_recorder_assessor", "coordinate_institutional_transfer"].includes(t.id)
                );
            }
        } else {
            // Standard Small Estate / Joint Transfer path
            if (type === "SMALL_ESTATE" && p.phase === "immediate_actions") {
                tasks.push({
                    scope: "CORE",
                    authorityScope: "PROBATE",
                    id: "prepare_affidavit",
                    title: "Prepare Small Estate Affidavit",
                    description: `Draft the ${state} Small Estate Affidavit to transfer assets without court.`,
                    estimatedTime: "1-2 hours",
                    requiresAuthority: false,
                    alerts: [{ type: "info", message: "Verification Required: Most banks require a 40-day waiting period from date of death before processing affidavits." }]
                });
            }
            if (type === "JOINT_TRANSFER" && p.phase === "immediate_actions") {
                tasks.push({
                    scope: "CORE",
                    authorityScope: "BOTH",
                    id: "transfer_joint_assets",
                    title: "Transfer Jointly Owned Assets",
                    description: "Submit death certificates to financial institutions to remove decedent from joint accounts.",
                    estimatedTime: "2-3 weeks"
                });
            }
        }

        // Apply Dynamic Renaming & Labeling
        let title = p.title;
        let subtitle = p.subtitle;

        if (isTOD) {
            if (p.phase === "immediate_actions") {
                title = "TOD Eligibility & Authority";
                subtitle = "State 1 & 2: Validation";
            } else if (p.phase === "asset_discovery") {
                title = "Escalation Verification";
                subtitle = "State 5: Exception Shield";
            } else if (p.phase === "creditor_claims") {
                title = "Creditor Exposure Review";
                subtitle = "State 4: Liability Assessment";
            } else if (p.phase === "asset_liquidation") {
                title = "Title Transfer Workflow";
                subtitle = "State 3: Execution";
            }
        }

        return { ...p, title, subtitle, tasks, isEscalationPath: false };
    });

    // Add Escalation Paths (Standard Probate Phases) at the end for TOD
    if (isTOD) {
        const escalationPhases = SETTLEMENT_PHASE_TASKS.filter(p =>
            ["court_filing"].includes(p.phase)
        ).map(p => ({
            ...p,
            title: `Escalation: ${p.title}`,
            subtitle: "⚠️ Triggered by Exception",
            isEscalationPath: true
        }));

        roadmap.push(...escalationPhases);
    }

    return roadmap;
}

function generateFiduciaryRoadmap(type: AuthorityType, state: string, modifiers: string[], activeEngines: string[] = [], hasWill?: boolean): PhaseTaskList[] {
    // 6-state machine for Trust Admin: Authority, Notice, Marshaling, Creditors, Tax, Close
    let roadmap = TRUST_PHASE_TASKS.map(p => {
        let tasks = [...p.tasks];

        // Filter out international tasks if modifier is not present
        if (!modifiers.includes("INTERNATIONAL_MODE")) {
            tasks = tasks.filter(t => !t.isInternationalOnly);
        }

        // Apply strict state compatibility
        tasks = tasks.filter(t =>
            (!t.applicability?.states || t.applicability.states.includes(state)) &&
            (!t.applicability?.excludePredicates?.includes(`is${state}`))
        );

        // Phase-specific additions and overrides
        if (p.phase === "immediate_actions") {
            tasks.push({
                scope: "CORE",
                authorityScope: "TRUST",
                id: "issue_cert_trust_gen",
                title: "Issue Certificate of Trust",
                description: "Prepare and notarize a Certificate of Trust to present successor trustee authority to banks.",
                estimatedTime: "1 hour"
            });
        }

        if (modifiers.includes("INSOLVENT")) {
            tasks.push({
                scope: "CORE",
                authorityScope: "BOTH",
                id: "insolvency_prioritization",
                title: "Statutory Priority Assessment",
                description: "Estate liabilities may exceed assets. The fiduciary must strictly follow statutory payment priority to avoid personal liability.",
                alerts: [{ type: "important", message: "Fiduciary Risk: Paying a lower-priority debt before higher-priority obligations (like administration or funeral costs) may result in personal liability." }],
                isAttorneyReviewNode: true
            });
        }

        if (modifiers.includes("BUSINESS_ESTATE")) {
            if (p.phase === "immediate_actions") {
                tasks.push({
                    scope: "CORE",
                    authorityScope: "BOTH",
                    id: "business_operating_authority",
                    title: "Establish Business Operating Authority",
                    description: "Confirm legal authority to continue business operations to avoid loss of value.",
                    tags: ["risk-guardrail"]
                });
            }
            if (p.phase === "asset_discovery") {
                tasks.push({
                    scope: "CORE",
                    authorityScope: "BOTH",
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
                    scope: "CORE",
                    authorityScope: "BOTH",
                    id: "minor_distribution_block",
                    title: "Establish Blocked Accounts for Minors",
                    description: "Distributions to minors must be held in court-approved blocked accounts or trusts.",
                    alerts: [{ type: "important", message: "Do NOT distribute directly to a minor. This is a violation of probate law." }]
                });
            }
        }

        if (modifiers.includes("UNCLAIMED_PROPERTY") && p.phase === "asset_discovery") {
            tasks.push({
                scope: "CORE",
                authorityScope: "BOTH",
                id: "search_state_unclaimed",
                title: "Search State Unclaimed Property",
                description: "Check state controller databases for forgotten accounts or safe deposit boxes.",
                tags: ["fiduciary"]
            });
        }

        if (modifiers.includes("CONTESTED")) {
            tasks.unshift({
                scope: "CORE",
                authorityScope: "BOTH",
                id: "litigation_hold",
                title: "LITIGATION HOLD: Distribution Freeze",
                description: "Estate is contested. Do not distribute any assets or pay non-essential claims without court order.",
                alerts: [{ type: "caution", message: "Personal liability risk: Distributions during a contest may be clawed back or surcharge the fiduciary." }]
            });
        }

        // STRIP AUTHORITY REQUIREMENT: In Trust tracks, court-issued Letters are NOT the default.
        tasks = tasks.map(t => ({ ...t, requiresAuthority: false }));

        // GATING: Hide probate-only tasks in Trust track
        const probateOnlyCategories = ["probate", "court-issued"];
        const probateOnlyKeywords = ["Probate Application", "Letters", "Bond calculation", "Surrogate filing"];
        tasks = tasks.filter(t => {
            if (probateOnlyCategories.includes(t.category || "")) return false;
            if (probateOnlyKeywords.some(k => t.title?.includes(k))) return false;
            return true;
        });

        return { ...p, tasks };
    });

    // Add modifier phases if applicable
    if (modifiers.includes("ANCILLARY")) {
        const ancillary = MODIFIER_PHASE_TASKS.find(p => p.phase === "ancillary_phase");
        if (ancillary) roadmap.push(JSON.parse(JSON.stringify(ancillary)));
    }
    if (modifiers.includes("CONTESTED")) {
        const litigation = MODIFIER_PHASE_TASKS.find(p => p.phase === "litigation_phase");
        if (litigation) roadmap.push(JSON.parse(JSON.stringify(litigation)));
    }
    if (modifiers.includes("INSOLVENT")) {
        const insolvency = MODIFIER_PHASE_TASKS.find(p => p.phase === "insolvency_phase");
        if (insolvency) roadmap.push(JSON.parse(JSON.stringify(insolvency)));
    }

    // Add Probate Escalation if triggered
    if (modifiers.includes("PROBATE_ESCALATION")) {
        roadmap.push({ ...PROBATE_ESCALATION_PHASE });
    }

    return roadmap;
}

function generateProbateRoadmap(type: AuthorityType, state: string, modifiers: string[], activeEngines: string[] = [], hasWill?: boolean): PhaseTaskList[] {
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
                    scope: "CORE",
                    authorityScope: "PROBATE",
                    id: "file_summary_petition",
                    title: "File Petition for Summary Administration",
                    description: "For FL estates < $75k, file this petition to bypass full formal probate.",
                    category: "probate"
                });
            }
            return { ...p, tasks };
        });

        // Handle Ancillary Probate
        // Final sorting — ensure milestones are respected
        const courtFilingPhase = roadmap.find((p: PhaseTaskList) => p.phase === "court_filing");
        if (courtFilingPhase) {
            courtFilingPhase.tasks.unshift({
                scope: "CORE",
                authorityScope: "PROBATE",
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
        const creditorPhase = roadmap.find((p: PhaseTaskList) => p.phase === "creditor_claims");
        if (creditorPhase) {
            // State-neutral text; normalizeTextForState handles CA→state substitution,
            // but we avoid hardcoding CA references in the first place for non-CA states.
            const isCA = state === "CA";
            creditorPhase.tasks.unshift({
                scope: "CORE",
                authorityScope: "PROBATE",
                id: "verify_spousal_creditor_exemption",
                title: "Verify Creditor Notice Exemption",
                description: "Surviving spouses may be exempt from standard creditor notice if they assume personal liability for decedent's debts.",
                tags: ["risk-guardrail", "statutory"],
                alerts: [{
                    type: "warning",
                    message: "Assuming liability is high-risk. While it skips the creditor claim waiting period, you become personally responsible for the debts out of your own pocket."
                }],
                links: isCA
                    ? [{ label: "CA Prob. Code §13550", url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=13550.&lawCode=PROB" }]
                    : [{ label: "State spousal exemption statute", url: "#" }]
            });
        }
    }

    // Inject Overlays for Probate
    roadmap = roadmap.map((p: PhaseTaskList) => {
        let tasks = [...p.tasks];

        // Filter out international tasks if modifier is not present
        if (!modifiers.includes("INTERNATIONAL_MODE")) {
            tasks = tasks.filter(t => !t.isInternationalOnly);
        }

        // Apply strict track compatibility for Probate
        tasks = tasks.filter(t => !t.trackCompatibility || t.trackCompatibility.includes("PROBATE"));

        // Apply strict state compatibility & exclusion predicates
        tasks = tasks.filter(t =>
            (!t.applicability?.states || t.applicability.states.includes(state)) &&
            (!t.applicability?.excludePredicates?.includes(`is${state}`))
        );

        // Will Search vs General Doc Search
        if (hasWill !== undefined) {
            tasks = tasks.filter(t => {
                if (t.id === "locate_will") return hasWill;
                if (t.id === "locate_docs_no_will") return !hasWill;
                return true;
            });
        }

        if (modifiers.includes("INSOLVENT") && p.phase === "creditor_claims") {
            tasks.unshift({
                scope: "CORE",
                authorityScope: "PROBATE",
                id: "insolvency_freeze",
                title: "Insolvency ALERT: Freeze Distributions",
                description: "Estate liabilities exceed assets. DO NOT pay any debts or distribute any assets.",
                alerts: [{ type: "caution", message: "Contact legal counsel immediately for a pro-rata distribution plan." }]
            });
        }

        if (modifiers.includes("BUSINESS_ESTATE")) {
            if (p.phase === "court_filing") {
                tasks.push({
                    scope: "CORE",
                    authorityScope: "PROBATE",
                    id: "petition_operating_orders",
                    title: "Petition for Business Operating Orders",
                    description: "Ask the court for explicit permission to continue decedent's business operations.",
                    category: "probate"
                });
            }
            if (p.phase === "asset_discovery") {
                tasks.push({
                    scope: "CORE",
                    authorityScope: "PROBATE",
                    id: "business_appraisal",
                    title: "Conduct Business Valuation",
                    description: "Engage a certified appraiser to determine the value of decedent's business stake.",
                    tags: ["statutory"]
                });
            }
        }

        if (modifiers.includes("MINOR_HEIRS") && p.phase === "final_distribution") {
            tasks.unshift({
                scope: "CORE",
                authorityScope: "PROBATE",
                id: "minor_distribution_petition",
                title: "Petition for Minor Distribution Approval",
                description: "File to have the court approve the guardian or trustee for minor's inheritance.",
                alerts: [{ type: "important", message: "Distributions to minors require strict court oversight." }]
            });
        }

        if (modifiers.includes("CONTESTED")) {
            tasks.unshift({
                scope: "CORE",
                authorityScope: "PROBATE",
                id: "litigation_hold_probate",
                title: "LITIGATION HOLD: Freeze Distributions",
                description: "Will contest or heirship dispute detected. Assets must remain in the estate account until resolved.",
                alerts: [{ type: "caution", message: "Consult with estate litigation counsel before taking any non-routine actions." }]
            });
        }

        if (modifiers.includes("ELECTIVE_SHARE") && p.phase === "creditor_claims") {
            tasks.push({
                scope: "CORE",
                authorityScope: "PROBATE",
                id: "elective_share_calc",
                title: "Spousal Elective Share Calculation",
                description: "A spouse has asserted an elective share claim. Recalculate distribution priorities accordingly.",
                tags: ["fiduciary"]
            });
        }

        if (modifiers.includes("UNCLAIMED_PROPERTY") && p.phase === "asset_discovery") {
            tasks.push({
                scope: "CORE",
                authorityScope: "PROBATE",
                id: "search_state_unclaimed_probate",
                title: "Search State Unclaimed Property",
                description: "Check state controller databases for dormant accounts or forgotten insurance policies.",
                tags: ["fiduciary"]
            });
        }

        // GATING: Hide trust-only tasks in Probate track
        const trustOnlyIds = [
            "prepare_certification_of_trust",
            "evaluate_trust_solvency",
            "prepare_trust_accounting",
            "sign_trustee_acceptance"
        ];
        const trustOnlyKeywords = ["Certification of Trust", "Trust solvency", "Trust accounting", "Trustee acceptance"];
        tasks = tasks.filter(t => {
            if (trustOnlyIds.includes(t.id)) return false;
            if (trustOnlyKeywords.some(k => t.title?.includes(k))) return false;
            return true;
        });

        return { ...p, tasks };
    });

    // Add modifier phases if applicable
    if (modifiers.includes("ANCILLARY") || type === "ANCILLARY_PROBATE") {
        const ancillary = MODIFIER_PHASE_TASKS.find(p => p.phase === "ancillary_phase");
        if (ancillary) roadmap.push(JSON.parse(JSON.stringify(ancillary)));
    }
    if (modifiers.includes("CONTESTED") || type === "CONTESTED_ESTATE") {
        const litigation = MODIFIER_PHASE_TASKS.find(p => p.phase === "litigation_phase");
        if (litigation) roadmap.push(JSON.parse(JSON.stringify(litigation)));
    }
    if (modifiers.includes("INSOLVENT") || type === "INSOLVENT_ESTATE") {
        const insolvency = MODIFIER_PHASE_TASKS.find(p => p.phase === "insolvency_phase");
        if (insolvency) roadmap.push(JSON.parse(JSON.stringify(insolvency)));
    }

    return roadmap;
}

function generateDiscoveryRoadmap(type: AuthorityType, state: string, hasWill?: boolean): PhaseTaskList[] {
    const baseline = SETTLEMENT_PHASE_TASKS.filter(p =>
        ["immediate_actions", "asset_discovery"].includes(p.phase)
    );

    return baseline.map(p => {
        let tasks = p.tasks.filter(t =>
            (!t.applicability?.states || t.applicability.states.includes(state)) &&
            (!t.applicability?.excludePredicates?.includes(`is${state}`))
        );
        if (p.phase === "immediate_actions") {
            tasks.unshift({
                scope: "CORE",
                authorityScope: "BOTH",
                id: "initial_search_protocol",
                title: "Initialize Forensic Discovery Protocol",
                description: "Estate track is unknown. Begin systematic asset search to calibrate the correct legal path.",
                category: "probate"
            });
        }
        return { ...p, tasks };
    });
}
