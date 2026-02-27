import { SETTLEMENT_PHASE_TASKS } from "../../src/config/settlementPhases.js";
import { STATE_PHASE_OVERRIDES, NEUTRAL_PHASE_MILESTONES } from "../../src/config/roadmapMetadata.js";
import { prisma as db } from "../db.js";
import { calculateAuthorityRecommendation } from "../../src/lib/authorityEngine.js";
import { getLettersTerm, getStateRule } from "../../src/lib/stateRules.js";
import { logger } from "../lib/logger.js";
import { CountyOverrideService } from "./countyOverrideService.js";
import { filterPhasesByJurisdiction } from "../../src/shared/filterByJurisdiction.js";
const FOLLOW_UP_SPAWN_RULES = {
    // ── Creditor Notices ──────────────────────────────────────────────────────
    send_creditor_notices: { institutionName: "General Creditors", subject: "Creditor claim period — awaiting responses", responseWindowDays: 60 },
    publish_creditor_notice: { institutionName: "Published Creditors", subject: "Published notice — creditor claim window open", responseWindowDays: 60 },
    mail_creditor_notices: { institutionName: "Known Creditors", subject: "Mailed creditor notices — awaiting claim responses", responseWindowDays: 30 },
    // ── Financial Institutions ────────────────────────────────────────────────
    notify_financial_institutions: { institutionName: "Financial Institutions", subject: "Institution notification — awaiting account closure process", responseWindowDays: 30 },
    send_letters_testamentary_bank: { institutionName: "Bank / Financial Institution", subject: "Letters Testamentary submitted — awaiting acceptance", responseWindowDays: 10 },
    obtain_letters_testamentary: { institutionName: "Probate Court", subject: "Letters Testamentary application — awaiting issuance", responseWindowDays: 14 },
    // ── Property ──────────────────────────────────────────────────────────────
    request_property_appraisal: { institutionName: "Appraiser", subject: "Property appraisal requested — awaiting report", responseWindowDays: 30 },
    order_date_of_death_appraisal: { institutionName: "Certified Appraiser", subject: "Date-of-death appraisal ordered — awaiting delivery", responseWindowDays: 21 },
    // ── Court Filings ─────────────────────────────────────────────────────────
    file_petition: { institutionName: "Probate Court", subject: "Petition filed — awaiting court acknowledgment & hearing", responseWindowDays: 30 },
    file_probate_petition: { institutionName: "Surrogate's Court", subject: "Probate Petition filed — awaiting Decree & Letters", responseWindowDays: 30 },
    file_administration_petition: { institutionName: "Surrogate's Court", subject: "Administration Petition filed — awaiting Decree & Letters", responseWindowDays: 30 },
    file_inventory_appraisal: { institutionName: "Probate Court", subject: "Inventory & Appraisal filed — awaiting court confirmation", responseWindowDays: 14 },
    file_final_accounting: { institutionName: "Probate Court", subject: "Final Accounting filed — awaiting court approval", responseWindowDays: 21 },
    // ── Tax Authorities ───────────────────────────────────────────────────────
    file_final_income_tax: { institutionName: "IRS / State Tax Authority", subject: "Final income tax return filed — awaiting processing", responseWindowDays: 45 },
    request_tax_clearance: { institutionName: "State Tax Authority", subject: "Tax clearance requested — awaiting certificate", responseWindowDays: 30 },
    file_estate_tax_return: { institutionName: "IRS", subject: "Estate tax return (Form 706) filed — awaiting IRS response", responseWindowDays: 60 },
    // ── Government / Benefits ─────────────────────────────────────────────────
    contact_social_security: { institutionName: "Social Security Administration", subject: "SSA notification sent — awaiting benefit stoppage confirmation", responseWindowDays: 21 },
    notify_pension_plan: { institutionName: "Pension / Retirement Plan", subject: "Pension plan notified — awaiting survivor benefit processing", responseWindowDays: 30 },
    notify_employer: { institutionName: "Employer HR", subject: "Employer notified — awaiting final pay & benefits information", responseWindowDays: 14 },
    // ── Heirs ─────────────────────────────────────────────────────────────────
    notify_heirs_of_appointment: { institutionName: "Heirs / Beneficiaries", subject: "Heir notification sent — awaiting signed acknowledgments", responseWindowDays: 14 },
};
const formatCurrency = (value) => `$${value.toLocaleString()}`;
function applyStateRuleTokens(text, state) {
    const rule = getStateRule(state);
    return text
        .replace(/\{\{smallEstateThreshold\}\}/g, formatCurrency(rule.threshold))
        .replace(/\{\{smallEstateTerm\}\}/g, rule.smallEstateTerm)
        .replace(/\{\{smallEstateCitation\}\}/g, rule.smallEstateCitation?.join(", ") || "");
}
function normalizeTextForState(text, state) {
    if (!text)
        return text;
    const tokenized = applyStateRuleTokens(text, state);
    if (state === "CA")
        return tokenized;
    const lettersTerm = getLettersTerm(state);
    let out = tokenized;
    out = out.replace(/\bCertified Letters\s*\(DE-\d+\)/gi, `Certified ${lettersTerm}`);
    out = out.replace(/\bLetters Testamentary\s*\(DE-\d+\)/gi, lettersTerm);
    out = out.replace(/\bLetters of Authority\s*\(DE-\d+\)/gi, lettersTerm);
    out = out.replace(/\bLetters\s*\(DE-\d+\)/gi, lettersTerm);
    out = out.replace(/\s*\(DE-\d+\)/gi, "");
    out = out.replace(/\bDE-\d+\b/gi, "");
    out = out.replace(/\bMedi-Cal\b/gi, "Medicaid");
    out = out.replace(/\bDHCS\b/gi, "Medicaid");
    out = out.replace(/\bCalifornia Probate Code\b/gi, "State probate code");
    out = out.replace(/\bCA Prob\. Code\b/gi, "State probate code");
    out = out.replace(/\bCalifornia law\b/gi, "State law");
    out = out.replace(/\bCalifornia\b/gi, "state");
    out = out.replace(/\bCA\b/g, "state");
    out = out.replace(/\bstateCode\b/g, state);
    if (state === "MA") {
        out = out.replace(/\bSmall Estate Affidavit\b/gi, "Voluntary Administration Statement");
        out = out.replace(/\bSmall Estate\b/gi, "Voluntary Administration");
        out = out.replace(/\bLetters Testamentary\b/gi, "Letters of Authority");
        out = out.replace(/\bLetters of Administration\b/gi, "Letters of Authority");
        out = out.replace(/\bFile Probate Petition\b/gi, "File Petition for Probate");
    }
    out = out.replace(/\s{2,}/g, " ").trim();
    return out;
}
// ─────────────────────────────────────────────────────────────────────────────
// Static lookup: hardcoded stateOverrides from SETTLEMENT_PHASE_TASKS by task ID.
// DB-loaded tasks don't carry stateOverrides, so we resolve them from this map.
// ─────────────────────────────────────────────────────────────────────────────
const HARDCODED_STATE_OVERRIDES_MAP = new Map();
for (const phase of SETTLEMENT_PHASE_TASKS) {
    for (const task of phase.tasks) {
        if (task.stateOverrides) {
            HARDCODED_STATE_OVERRIDES_MAP.set(task.id, task.stateOverrides);
        }
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Safe Task Merge Function (State-Neutral First)
// Deterministic merge: no CA fallback, only state-specific override merges.
// Base task remains neutral if no override exists.
// ─────────────────────────────────────────────────────────────────────────────
export function resolveTaskForState(task, stateCode, county) {
    // 1️⃣ Fail-Closed Scope Check — aligned with shared/filterByJurisdiction.ts
    if (!task.scope || task.scope === "UNSCOPED") {
        logger.error(`UNSCOPED task detected: ${task.id}. Excluding.`);
        return null;
    }
    const isCore = task.scope === "CORE";
    const isThisState = task.scope === `US-${stateCode}`;
    const isAllowedState = task.allowedStates?.includes(stateCode) ?? false;
    if (isCore) {
        // CORE tasks with applicability.states: secondary gate (defense-in-depth)
        if (task.applicability?.states?.length) {
            if (!task.applicability.states.includes(stateCode)) {
                return null;
            }
        }
    }
    else if (!isThisState && !isAllowedState) {
        return null; // Strict isolation
    }
    // 2️⃣ Optional Additive County Filter
    if (task.allowedCounties && task.allowedCounties.length > 0) {
        if (!county || !task.allowedCounties.includes(county)) {
            return null;
        }
    }
    // 3️⃣ Legacy Hard gate by applicability.states (for safety/gradual migration)
    if (task.applicability?.states && task.applicability.states.length > 0) {
        if (!task.applicability.states.includes(stateCode)) {
            return null;
        }
    }
    const base = { ...task };
    // 4️⃣ Apply stateOverrides if present
    const override = task.stateOverrides?.[stateCode]
        || HARDCODED_STATE_OVERRIDES_MAP.get(task.id)?.[stateCode];
    if (override) {
        const merged = override;
        return {
            ...base,
            ...override,
            alerts: override.alerts ?? base.alerts,
            requiredDocs: merged.requiredDocs ?? base.requiredDocs,
            links: override.links ?? base.links,
            outputs: merged.outputs ?? base.outputs,
            dependencies: merged.dependencies ?? base.dependencies,
        };
    }
    return base;
}
/**
 * Strict variant — throws on state mismatch.
 * Use in deterministic generation paths: PDF export, snapshot tests, CI.
 */
export function resolveTaskForStateStrict(task, stateCode) {
    const result = resolveTaskForState(task, stateCode);
    if (result === null) {
        throw new Error(`Task ${task.id} is restricted to states: ${task.applicability?.states?.join(", ")} (current: ${stateCode})`);
    }
    return result;
}
/**
 * Full task normalization: resolveTaskForState() merge + text normalization + CA dep cleanup.
 * Returns null if task is excluded for this state.
 */
function normalizeTaskForState(task, state, county) {
    // Resolve state override merge (state-neutral first pattern)
    const mergedTask = resolveTaskForState(task, state, county);
    if (mergedTask === null)
        return null; // Task excluded for this state
    // Clean CA-only dependencies for non-CA states
    if (state !== "CA" && mergedTask.dependencies) {
        mergedTask.dependencies = mergedTask.dependencies.filter((dep) => !CA_ONLY_TASK_IDS.has(dep));
    }
    // Apply text normalization (CA form numbers, Medi-Cal → Medicaid, etc.)
    return {
        ...mergedTask,
        title: normalizeTextForState(mergedTask.title, state) || mergedTask.title,
        description: normalizeTextForState(mergedTask.description, state) || mergedTask.description,
        utility: normalizeTextForState(mergedTask.utility, state),
        rationale: normalizeTextForState(mergedTask.rationale, state),
        conditionalRequirementLabel: normalizeTextForState(mergedTask.conditionalRequirementLabel, state) || mergedTask.conditionalRequirementLabel,
        requiredDocs: mergedTask.requiredDocs?.map(doc => normalizeTextForState(doc, state) || doc),
        alerts: mergedTask.alerts?.map(alert => ({
            ...alert,
            message: normalizeTextForState(alert.message, state) || alert.message
        })),
        links: mergedTask.links?.map(link => ({
            ...link,
            label: normalizeTextForState(link.label, state) || link.label
        })),
        primaryActionLabel: normalizeTextForState(mergedTask.primaryActionLabel, state),
        formNames: mergedTask.formNames?.map(f => normalizeTextForState(f, state) || f)
    };
}
// ─────────────────────────────────────────────────────────────────────────────
// (Overrides and Neutral milestones now imported from roadmapMetadata)
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// CA-only tokens that must NEVER appear for non-CA states
// ─────────────────────────────────────────────────────────────────────────────
const CA_ONLY_TASK_IDS = new Set([
    "prepare_notice_proposed_action",
    "wait_proposed_action_period",
    "petition_confirm_sale",
    "obtain_sale_confirmation_order",
    "ca_calculate_overbid_requirements",
    "ca_notice_of_hearing",
    "ca_attend_confirmation_hearing",
]);
// ─────────────────────────────────────────────────────────────────────────────
// GA-only task IDs that must NEVER appear for non-GA states
// Georgia ultra-minimal cleanup: Year's Support and No Admin tasks
// ─────────────────────────────────────────────────────────────────────────────
const GA_ONLY_TASK_IDS = new Set([
    "ga_years_support_petition",
    "ga_years_support_citation",
    "ga_years_support_order",
    "file_ga_no_admin",
]);
// ─────────────────────────────────────────────────────────────────────────────
// Tasks to EXCLUDE for Georgia (GA ultra-minimal cleanup)
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
const CA_ONLY_TEXT_TOKENS = [
    "Notice of Proposed Action",
    "15-Day Objection Period",
    "15-day waiting",
    "Petition to Confirm Sale",
    "Sale Confirmation Order",
    "IAEA",
    "Independent Administration",
];
// Additional CA-only title patterns for text-based defense (catches DB tasks with stale titles)
const CA_ONLY_TITLE_PATTERNS = [
    /\bNotice of Proposed Action\b/i,
    /\b15-Day Objection Period\b/i,
    /\bPetition to Confirm Sale\b/i,
    /\bSale Confirmation Order\b/i,
    /\bIAEA\b/,
    /\bIndependent Administration\b/i,
];
// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — State-Based Task Filtering (Before Rendering)
// Filters tasks by applicability.states — makes CA-only tasks impossible to
// render outside CA. Combined with CA_ONLY_TASK_IDS and title-pattern guards.
// ─────────────────────────────────────────────────────────────────────────────
export function filterTasksForState(tasks, stateCode) {
    return tasks.filter((task) => {
        // Hard gate: CA-only task IDs
        if (CA_ONLY_TASK_IDS.has(task.id)) {
            return stateCode === "CA";
        }
        // Hard gate: GA-only task IDs
        if (GA_ONLY_TASK_IDS.has(task.id)) {
            return stateCode === "GA";
        }
        // Hard gate: GA-excluded task IDs (hide spousal/succession petitions and generic creditor placeholder)
        if (GA_EXCLUDED_TASK_IDS.has(task.id)) {
            return stateCode !== "GA";
        }
        // Hard gate: applicability.states
        if (task.applicability?.states && task.applicability.states.length > 0) {
            return task.applicability.states.includes(stateCode);
        }
        // Title-pattern defense: catches DB tasks with stale CA titles
        if (stateCode !== "CA" && CA_ONLY_TITLE_PATTERNS.some(p => p.test(task.title))) {
            return false;
        }
        return true;
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Contamination Guard (Prevents Future Leakage)
// Protects all 50 states. Throws on contamination so it physically cannot
// regress to CA logic in NY, TX, FL, etc.
// ─────────────────────────────────────────────────────────────────────────────
const CA_TOKENS = [
    "Notice of Proposed Action",
    "15-Day Objection",
    "Petition to Confirm Sale",
    "Sale Confirmation Order",
    "IAEA",
    "4-Month Claim Period",
    "4-Month Claim Window",
    "DE-",
    "After Notice Published",
    "After Inventory Filed",
    "IAEA / Court-Confirmed Sales",
    "IAEA",
    "Notice of Proposed Action",
    "After Claim Period",
    "Independent Administration",
];
export function validateStateContent(renderedText, stateCode) {
    if (stateCode === "CA")
        return;
    for (const token of CA_TOKENS) {
        if (renderedText.includes(token)) {
            throw new Error(`State contamination detected: '${token}' found in ${stateCode} roadmap`);
        }
    }
}
/**
 * Phase-level contamination check: scans all rendered phases for CA-specific
 * tokens that leaked into non-CA states. Catches and logs (non-fatal at runtime).
 */
function validateNoStateContamination(phases, state) {
    if (state === "CA")
        return;
    for (const phase of phases) {
        // Check phase-level metadata
        try {
            if (phase.milestone)
                validateStateContent(phase.milestone, state);
            if (phase.subtitle)
                validateStateContent(phase.subtitle, state);
        }
        catch (err) {
            logger.warn(`[roadmapService] ${err.message} (phase="${phase.phase}")`);
        }
        // Check task-level content
        for (const task of phase.tasks) {
            try {
                if (task.title)
                    validateStateContent(task.title, state);
                if (task.description)
                    validateStateContent(task.description, state);
            }
            catch (err) {
                logger.warn(`[roadmapService] ${err.message} (task="${task.id}")`);
            }
        }
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Phase Header Override Resolver
// No CA fallback — only state-specific or neutral default.
// Resolution: stateOverrides[state] → NEUTRAL_PHASE_MILESTONES → {}
// ─────────────────────────────────────────────────────────────────────────────
export function resolvePhaseHeader(phaseKey, stateCode) {
    const stateOverride = STATE_PHASE_OVERRIDES[stateCode]?.[phaseKey];
    const neutralDefault = NEUTRAL_PHASE_MILESTONES[phaseKey];
    return {
        milestone: stateOverride?.milestone || neutralDefault?.milestone,
        subtitle: stateOverride?.subtitle || neutralDefault?.subtitle,
    };
}
/**
 * Hard guard: remove CA-only tasks for non-CA states.
 * Delegates to the canonical filterTasksForState() for all state-based filtering.
 */
function removeCAOnlyTasks(phases, state) {
    if (state === "CA")
        return phases;
    return phases.map(phase => ({
        ...phase,
        tasks: filterTasksForState(phase.tasks, state),
    }));
}
/**
 * Normalize phase-level metadata AND task content for the estate's state.
 * Phase milestones, subtitles, and task text are all adjusted.
 */
function normalizePhasesForState(phases, state) {
    return phases.map(phase => {
        // Use canonical resolvePhaseHeader: state → DEFAULT → NEUTRAL → original
        const resolved = resolvePhaseHeader(phase.phase, state);
        return {
            ...phase,
            milestone: resolved.milestone || phase.milestone,
            subtitle: resolved.subtitle || phase.subtitle,
            tasks: phase.tasks.map(task => normalizeTaskForState(task, state)).filter((t) => t !== null),
        };
    });
}
function isProbateMode(profile) {
    return profile.activeEngines.includes("PROBATE") || profile.activeEngines.includes("AFFIDAVIT");
}
function ensurePreFilingCompliance(phases, profile) {
    const alreadyPresent = phases.some(p => p.phase === "pre_filing_compliance");
    if (alreadyPresent)
        return phases;
    // If not present, only auto-inject for NY probate (traditional behavior)
    if (profile.state !== "NY" || !isProbateMode(profile))
        return phases;
    const preFiling = SETTLEMENT_PHASE_TASKS.find(p => p.phase === "pre_filing_compliance");
    if (!preFiling)
        return phases;
    const immediateIndex = phases.findIndex(p => p.phase === "immediate_actions");
    const insertIndex = immediateIndex >= 0 ? immediateIndex + 1 : 0;
    const next = [...phases];
    next.splice(insertIndex, 0, JSON.parse(JSON.stringify(preFiling)));
    return next;
}
/**
 * Fetch jurisdiction rules from database with fallback to hardcoded defaults
 */
async function getJurisdictionRule(stateCode) {
    const dbRule = await db.jurisdictionRule.findUnique({
        where: { stateCode }
    });
    if (dbRule)
        return dbRule;
    // Fallback to hardcoded defaults from stateRules.ts
    const { STATE_RULES } = await import("../../src/lib/stateRules.js");
    return STATE_RULES[stateCode] || STATE_RULES["CA"];
}
/**
 * Analyze estate to determine which optional tasks should be shown
 */
export async function analyzeEstateProfile(estateId) {
    // Fetch estate with related data
    const estate = await db.estate.findUnique({
        where: { id: estateId },
        include: {
            heirs: true,
            assets: true,
            liabilities: true,
        },
    });
    if (!estate) {
        throw new Error(`Estate ${estateId} not found`);
    }
    if (!estate.deceasedState) {
        throw new Error("STATE_REQUIRED");
    }
    // Fetch state-specific rules from DB
    const stateRule = await getJurisdictionRule(estate.deceasedState);
    // Calculate insolvency FIRST so it is passed INTO calculateAuthorityRecommendation.
    // Previously insolvency was calculated AFTER the engine call, which meant
    // type was never set to INSOLVENT_ESTATE and the roadmap was incorrect for
    // estates with more debts than assets.
    const totalAssets = estate.assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
    const totalDebts = estate.liabilities.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const solvencyRatio = totalDebts > 0 ? (totalAssets / totalDebts) : 100;
    const hasInsolvencyRisk = solvencyRatio < 1.0;
    // Use registration-time estimates if no assets entered yet
    const estimatedPersonal = Number(estate.estimatedPersonalProperty) || 0;
    const estimatedReal = Number(estate.estimatedRealProperty) || 0;
    const registrationEstimate = estimatedPersonal + estimatedReal;
    // Calculate recommendation using the multi-dimensional engine.
    // All 7 XLSX dimensions must be passed here:
    //   hasWill, isTrustRevocable, hasTODDeed, hasContest, isSpouse, isOutOfState, hasInsolvencyRisk
    const rec = calculateAuthorityRecommendation(estate.assets, estate.deceasedState, {
        hasWill: estate.hasWill,
        // isTrustRevocable: schema field (nullable Boolean). undefined = no trust / not known.
        isTrustRevocable: estate.isTrustRevocable ?? undefined,
        isOutOfState: estate.isOutOfState ?? false,
        // isSurvivingSpouse: used for spousal petition routing
        isSpouse: estate.isSurvivingSpouse ?? false,
        hasMinors: estate.hasMinorBeneficiaries || estate.heirs.some(h => !h.isAdult),
        hasContest: estate.hasContest,
        hasTODDeed: estate.hasTODDeed ?? estate.assets.some((a) => a.todDeedRecorded),
        // Pass pre-calculated insolvency risk so the engine sets type=INSOLVENT_ESTATE correctly
        hasInsolvencyRisk,
        // Pass registration-time estimate so engine can pick a procedure even with 0 assets
        estimatedValue: registrationEstimate > 0 ? registrationEstimate : undefined
    });
    // Ensure INSOLVENT modifier is present and PROBATE engine active when insolvent
    if (hasInsolvencyRisk) {
        if (!rec.modifiers.includes("INSOLVENT"))
            rec.modifiers.push("INSOLVENT");
        if (!rec.activeEngines.includes("PROBATE"))
            rec.activeEngines.push("PROBATE");
    }
    // Compute state-specific predicates for task filtering
    const stateCode = estate.deceasedState;
    const isNJ = stateCode === "NJ";
    const isOH = stateCode === "OH";
    const isGA = stateCode === "GA";
    const isCA = stateCode === "CA";
    const isNY = stateCode === "NY";
    const isTX = stateCode === "TX";
    const isFL = stateCode === "FL";
    const isPA = stateCode === "PA";
    const isIL = stateCode === "IL";
    const isMA = stateCode === "MA";
    const isMN = stateCode === "MN";
    const isVA = stateCode === "VA";
    const isWA = stateCode === "WA";
    const isAZ = stateCode === "AZ";
    const isCO = stateCode === "CO";
    const isCT = stateCode === "CT";
    const isMD = stateCode === "MD";
    const isNC = stateCode === "NC";
    const isSC = stateCode === "SC";
    return {
        id: estate.id,
        hasMinorBeneficiaries: rec.modifiers?.includes("MINOR_HEIRS") || false,
        isSmallEstate: rec.isEligibleForSmallEstate,
        isPrimaryResidence: estate.hasPrimaryResidence || estate.assets.some(a => a.assetType === "real_estate"),
        isContested: rec.modifiers?.includes("CONTESTED") || false,
        state: estate.deceasedState,
        estimatedValue: rec.probateTotal,
        totalDebts,
        solvencyRatio,
        authoritySource: rec.authoritySource,
        procedureType: rec.procedureType,
        distributionModel: rec.distributionModel,
        activeEngines: rec.activeEngines,
        hasWill: estate.hasWill,
        hasUnknownHeirs: estate.hasUnknownHeirs,
        has_foreign_beneficiary: estate.internationalReasons?.includes("FOREIGN_BENEFICIARY") || estate.internationalReasons?.includes("FOREIGN_BENEFICIARIES") || false,
        executor_non_us_resident: estate.internationalReasons?.includes("EXECUTOR_RESIDENCE") || false,
        // State-specific predicates for task exclusion
        isNJ,
        isOH,
        isGA,
        isCA,
        isNY,
        isTX,
        isFL,
        isPA,
        isIL,
        isMA,
        isMN,
        isVA,
        isWA,
        isAZ,
        isCO,
        isCT,
        isMD,
        isNC,
        isSC,
    };
}
/**
 * Filter tasks based on estate profile and exclusivity
 */
export function filterTasksForEstate(allTasks, profile, completedTaskIds = []) {
    // 1. Identify which exclusive groups have a completed task
    const completedGroups = new Set();
    allTasks.forEach(phase => {
        phase.tasks.forEach(task => {
            if (task.exclusiveGroup && completedTaskIds.includes(task.id)) {
                completedGroups.add(task.exclusiveGroup);
            }
        });
    });
    const filteredPhases = allTasks.map((phaseList) => ({
        ...phaseList,
        tasks: phaseList.tasks.filter((task) => {
            // (normalizeTaskForState is called upstream or we should call it here if needed)
            // Actually, SETTLEMENT_PHASE_TASKS contains PhaseTasks which need normalization.
            // Resolve state override merge (state-neutral first pattern)
            const mergedTask = resolveTaskForState(task, profile.state);
            if (mergedTask === null)
                return false; // Task excluded for this state
            // Note: we are filtering, but we ALSO need to map the tasks to their normalized versions.
            // The current filterTasksForEstate logic in this project seems to only filter, 
            // but the normalizeTaskForState call should probably happen here.
            // 2. Handle Exclusivity: If a group is "set", only show the completed task in that group
            if (task.exclusiveGroup && completedGroups.has(task.exclusiveGroup)) {
                return completedTaskIds.includes(task.id);
            }
            // 3. Handle Track Compatibility (Multi-Dimensional)
            if (task.trackCompatibility && task.trackCompatibility.length > 0) {
                const isCompatible = task.trackCompatibility.some(track => profile.activeEngines.includes(track) ||
                    (track === "AFFIDAVIT" && profile.procedureType === "SMALL_ESTATE_AFFIDAVIT"));
                if (!isCompatible)
                    return false;
            }
            // 4. Handle Procedure Variants (e.g., TESTATE vs INTESTATE)
            if (task.applicability?.variants && task.applicability.variants.length > 0) {
                const hasMatchingVariant = task.applicability.variants.some(variant => {
                    if (variant === "TESTATE")
                        return profile.hasWill;
                    if (variant === "INTESTATE")
                        return !profile.hasWill;
                    return false;
                });
                if (!hasMatchingVariant)
                    return false;
            }
            // 5. Handle Predicates (AND/OR/NOT) and State Applicability
            if (task.applicability) {
                const { predicatesAll, predicatesAny, excludePredicates, states } = task.applicability;
                const profileMap = profile;
                if (states && states.length > 0) {
                    if (!states.includes(profile.state))
                        return false;
                }
                if (predicatesAll && predicatesAll.length > 0) {
                    const allTrue = predicatesAll.every(p => !!profileMap[p]);
                    if (!allTrue)
                        return false;
                }
                if (predicatesAny && predicatesAny.length > 0) {
                    const anyTrue = predicatesAny.some(p => !!profileMap[p]);
                    if (!anyTrue)
                        return false;
                }
                if (excludePredicates && excludePredicates.length > 0) {
                    const anyExcl = excludePredicates.some(p => !!profileMap[p]);
                    if (anyExcl)
                        return false;
                }
            }
            // Always show non-optional tasks (if they survived compatibility, variant, & predicate checks)
            const isMandatory = mergedTask.isOptional === false;
            if (isMandatory)
                return true;
            // Filter based on task ID and estate profile
            switch (task.id) {
                case "identify_minor_beneficiaries":
                case "petition_guardian_ad_litem":
                case "obtain_guardian_order":
                case "coordinate_with_guardian":
                case "guardian_distribution_approval":
                    return profile.hasMinorBeneficiaries;
                case "check_primary_residence_succession":
                case "file_succession_petition":
                case "give_succession_notice":
                case "obtain_succession_order":
                    return (profile.isSmallEstate &&
                        profile.isPrimaryResidence &&
                        profile.state === "CA");
                case "respond_to_objections":
                case "attend_contest_hearing":
                case "resolve_contest":
                    return profile.isContested;
                case "request_bond_waiver":
                case "file_bond_waiver":
                case "obtain_bond_waiver_order":
                    return profile.authoritySource === "COURT";
                case "track_special_notice_requests":
                case "serve_special_notice_parties":
                    return profile.authoritySource === "COURT";
                case "locate_will":
                    return profile.hasWill;
                case "locate_docs_no_will":
                    return !profile.hasWill;
                // MA Specific Logic
                case "file_estate_tax_return":
                case "evaluate_form_706":
                    if (profile.state === 'MA') {
                        return profile.estimatedValue > 2000000;
                    }
                    return true; // Use default logic for other states
                case "handle_bond_waivers":
                case "obtain_bond_waiver_order":
                case "request_bond_waiver":
                    if (profile.state === 'MA') {
                        // In MA, bonds are almost always required but surety can be waived
                        return profile.authoritySource === "COURT";
                    }
                    return profile.authoritySource === "COURT";
                default:
                    return true;
            }
        }),
    })).map(phaseList => ({
        ...phaseList,
        tasks: phaseList.tasks.map(t => normalizeTaskForState(t, profile.state))
    }));
    // 6. Scrub Dependencies: Filter out any dependencies that are not present in the current roadmap
    const allVisibleTaskIds = new Set(filteredPhases.flatMap(p => p.tasks.map(t => t.id)));
    return filteredPhases.map(phase => ({
        ...phase,
        tasks: phase.tasks.map(task => ({
            ...task,
            dependencies: task.dependencies?.filter(depId => allVisibleTaskIds.has(depId)) || []
        }))
    }));
}
/**
 * Get the latest published roadmap version for a settlement type
 */
async function getLatestPublishedVersion(settlementTypeCode) {
    const version = await db.roadmapVersion.findFirst({
        where: {
            settlementTypeCode,
            isPublished: true,
            isActive: true
        },
        orderBy: { releasedAt: 'desc' },
        select: { version: true }
    });
    return version?.version || null;
}
/**
 * Get roadmap from database based on estate's settlement type
 * Supports estate-time pinning via roadmapVersion field
 */
export async function getRoadmapFromDatabase(estateId, profile, completedTaskIds) {
    // Get estate to determine settlement type and version pinning
    const estate = await db.estate.findUnique({
        where: { id: estateId },
        select: {
            estateType: true,
            settlementPath: true,
            roadmapVersion: true,
            roadmapPinnedAt: true,
            probateCounty: true,
            countyOverrideHash: true
        },
    });
    if (!estate)
        throw new Error(`Estate ${estateId} not found`);
    // Determine which settlement type to use
    // Priority: Derived Procedure (from assets) -> Explicit Path -> Default
    const settlementTypeCode = profile.procedureType !== "UNSET"
        ? profile.procedureType
        : (estate.settlementPath || estate.estateType || 'FORMAL_PROBATE');
    // Handle version pinning - if estate has a pinned version, use that
    // Otherwise, get the latest published version
    let targetVersion = estate.roadmapVersion;
    let isPinned = !!estate.roadmapVersion;
    if (!targetVersion) {
        // No pinned version - use latest published
        targetVersion = await getLatestPublishedVersion(settlementTypeCode);
    }
    // Build the query based on whether we're using a pinned version or latest
    const whereClause = { code: settlementTypeCode };
    // If pinned to a specific version, we'd need to match against roadmap_versions
    // For now, we use the settlementType and assume version consistency
    // The version pinning is primarily for the estate record itself
    // Fetch roadmap from database
    const settlementType = await db.settlementType.findUnique({
        where: whereClause,
        include: {
            phases: {
                orderBy: { orderIndex: 'asc' },
                include: {
                    tasks: {
                        orderBy: { orderIndex: 'asc' },
                        /* include: {
                          stateOverrides: true,
                        } */
                    },
                },
            },
        },
    });
    if (!settlementType) {
        logger.warn(`Settlement type ${settlementTypeCode} not found in database, falling back to hardcoded SETTLEMENT_PHASE_TASKS`);
        // Fallback to hardcoded tasks if type not found
        const injected = ensurePreFilingCompliance(SETTLEMENT_PHASE_TASKS, profile);
        const filtered = filterTasksForEstate(injected, profile, completedTaskIds);
        const caGuarded = removeCAOnlyTasks(filtered, profile.state);
        return normalizePhasesForState(caGuarded, profile.state);
    }
    // Fetch all state overrides for this state once to avoid N+1 or broken relations
    const allOverrides = await db.roadmapTaskStateOverride.findMany({
        where: { stateCode: profile.state }
    });
    const overrideMap = new Map(allOverrides.map(o => [o.taskKey, o]));
    // Convert database format to PhaseTaskList format
    const phases = settlementType.phases.map((phase) => ({
        phase: phase.phaseCode,
        title: phase.title,
        subtitle: phase.subtitle || '',
        milestone: phase.milestone || '',
        description: phase.description || '',
        isEscalationPath: phase.isEscalationPath,
        tasks: phase.tasks.map((task) => {
            // Find state override if it exists for this estate's state
            const stateOverride = overrideMap.get(task.taskCode);
            return {
                id: task.taskCode,
                scope: task.scope || 'CORE',
                allowedStates: task.applicableStates && task.applicableStates.length > 0 ? task.applicableStates : undefined,
                allowedCounties: task.allowedCounties && task.allowedCounties.length > 0 ? task.allowedCounties : undefined,
                title: stateOverride?.title || task.title,
                description: stateOverride?.description || task.description || task.title,
                estimatedTime: task.estimatedTime || undefined,
                category: task.category,
                isOptional: stateOverride?.isOptional !== undefined ? stateOverride.isOptional : task.isOptional,
                requiresAuthority: task.requiresAuthority,
                requiredDocs: task.requiredDocs,
                dependencies: stateOverride?.dependencies?.length > 0 ? stateOverride.dependencies : task.dependencies,
                exclusiveGroup: task.exclusiveGroup || undefined,
                trackCompatibility: task.trackCompatibility,
                tags: task.tags,
                alerts: task.alerts || undefined,
                links: stateOverride?.links || task.links || undefined,
                rationale: task.rationale || undefined,
                isAttorneyReviewNode: task.isAttorneyReviewNode,
                attorneyReviewReason: task.attorneyReviewReason || undefined,
                isConditional: task.isConditional,
                conditionalRequirementLabel: task.conditionalRequirementLabel || undefined,
                utility: task.utility || undefined,
                requiresNotary: task.requiresNotary,
                requiresPhysicalMail: task.requiresPhysicalMail,
                deadlineWarningId: task.deadlineWarningId || undefined,
                isInternationalOnly: task.isInternationalOnly,
                primaryActionLabel: stateOverride?.primaryActionLabel || task.primaryActionLabel || undefined,
                primaryActionUrl: stateOverride?.primaryActionUrl || task.primaryActionUrl || undefined,
                formNames: (stateOverride?.formNames && stateOverride.formNames.length > 0) ? stateOverride.formNames : task.formNames,
                officialForms: stateOverride?.officialForms || undefined,
                changeLog: stateOverride?.changeLog || undefined,
                isLongHorizon: undefined, // Add mapping if needed in future schema
                applicability: (task.applicableVariants && task.applicableVariants.length > 0) ||
                    (task.applicableStates && task.applicableStates.length > 0) ||
                    (task.predicatesAll && task.predicatesAll.length > 0) ||
                    (task.predicatesAny && task.predicatesAny.length > 0) ||
                    (task.excludePredicates && task.excludePredicates.length > 0)
                    ? {
                        states: task.applicableStates && task.applicableStates.length > 0 ? task.applicableStates : undefined,
                        variants: task.applicableVariants && task.applicableVariants.length > 0 ? task.applicableVariants : undefined,
                        predicatesAll: task.predicatesAll && task.predicatesAll.length > 0 ? task.predicatesAll : undefined,
                        predicatesAny: task.predicatesAny && task.predicatesAny.length > 0 ? task.predicatesAny : undefined,
                        excludePredicates: task.excludePredicates && task.excludePredicates.length > 0 ? task.excludePredicates : undefined,
                    }
                    : undefined,
                requiredProfileFields: task.requiredProfileFields && task.requiredProfileFields.length > 0 ? task.requiredProfileFields : undefined,
                outputs: task.outputs && task.outputs.length > 0 ? task.outputs : undefined,
            };
        }),
    }));
    const injected = ensurePreFilingCompliance(phases, profile);
    const filtered = filterTasksForEstate(injected, profile, completedTaskIds);
    // Apply unified jurisdiction filter (fail-closed scope check)
    const { phases: scopeFiltered } = filterPhasesByJurisdiction(filtered, profile.state);
    // Apply county overrides with pinning awareness
    let finalizedPhases = scopeFiltered;
    if (estate.probateCounty) {
        // Check if overrides have drifted if pinned
        let shouldApply = true;
        if (estate.countyOverrideHash) {
            const currentHash = await CountyOverrideService.getOverrideHash(profile.state, estate.probateCounty);
            if (currentHash !== estate.countyOverrideHash) {
                logger.warn({ estateId, pinnedHash: estate.countyOverrideHash, currentHash }, "County overrides have drifted. Ignoring newer overrides for pinned roadmap.");
                shouldApply = false;
            }
        }
        if (shouldApply) {
            for (const phase of finalizedPhases) {
                phase.tasks = await CountyOverrideService.applyOverrides(profile.state, estate.probateCounty, phase.tasks);
            }
        }
    }
    const caGuarded = removeCAOnlyTasks(finalizedPhases, profile.state);
    return normalizePhasesForState(caGuarded, profile.state);
}
/**
 * Get personalized roadmap for an estate
 */
export async function getEstateRoadmap(estateId) {
    // Analyze estate profile
    const profile = await analyzeEstateProfile(estateId);
    // Get current progress
    const { completedTaskIds } = await getTaskCompletions(estateId);
    // Get roadmap from database (with fallback to hardcoded tasks)
    const filteredPhases = await getRoadmapFromDatabase(estateId, profile, completedTaskIds);
    // Development-time contamination check: warn if CA tokens leaked into non-CA state
    validateNoStateContamination(filteredPhases, profile.state);
    // Get estate for version info
    const estate = await db.estate.findUnique({
        where: { id: estateId },
        select: { roadmapVersion: true, roadmapPinnedAt: true }
    });
    // Return roadmap with triggers
    return {
        estateId,
        phases: filteredPhases,
        triggers: {
            hasMinors: profile.hasMinorBeneficiaries,
            isSmallEstate: profile.isSmallEstate,
            isPrimaryResidence: profile.isPrimaryResidence,
            isContested: profile.isContested,
            showBondWaiver: profile.authoritySource === "COURT",
            showSpecialNotice: profile.authoritySource === "COURT",
            activeEngines: profile.activeEngines
        },
        profile,
        // Include version info for client awareness
        version: estate?.roadmapVersion || 'latest',
        pinnedAt: estate?.roadmapPinnedAt,
    };
}
/**
 * Pin roadmap for an estate
 * Sets all hashes and version to freeze the current roadmap.
 */
export async function pinEstateRoadmap(estateId, userId) {
    const estate = await db.estate.findUnique({
        where: { id: estateId },
        select: {
            id: true,
            deceasedState: true,
            probateCounty: true,
            estateType: true,
            settlementPath: true
        }
    });
    if (!estate) {
        throw new Error(`Estate ${estateId} not found`);
    }
    if (!estate.deceasedState) {
        throw new Error("STATE_REQUIRED");
    }
    const profile = await analyzeEstateProfile(estateId);
    // Determine settlement type logic similar to getRoadmapFromDatabase
    const settlementTypeCode = profile.procedureType !== "UNSET"
        ? profile.procedureType
        : (estate.settlementPath || estate.estateType || 'FORMAL_PROBATE');
    const version = await getLatestPublishedVersion(settlementTypeCode) || '1.0.0';
    const pinnedAt = new Date();
    // 1. Get State Roadmap Hash (representing the core + state rules)
    // For now, we can use the version's schemaHash or derive one
    const roadmapVersionRecord = await db.roadmapVersion.findUnique({
        where: { version_settlementTypeCode: { version, settlementTypeCode } }
    });
    const stateRulesetHash = roadmapVersionRecord?.schemaHash || `ruleset-${version}`;
    // 2. Get County Override Hash
    const countyOverrideHash = estate.probateCounty
        ? await CountyOverrideService.getOverrideHash(estate.deceasedState, estate.probateCounty)
        : null;
    await db.estate.update({
        where: { id: estateId },
        data: {
            roadmapVersion: version,
            roadmapPinnedAt: pinnedAt,
            stateRulesetHash,
            countyOverrideHash,
            authorityType: profile.activeEngines.includes("TRUST") ? "TRUST" : "PROBATE" // Pinning authority context
        }
    });
    // Log activity
    await db.settlementActivity.create({
        data: {
            estateId,
            userId,
            type: "ROADMAP",
            action: "PINNED",
            notes: `Roadmap pinned to version ${version} (Ruleset: ${stateRulesetHash?.substring(0, 8)})`
        }
    });
    return { success: true, version, pinnedAt };
}
/**
 * Repin roadmap version for an estate with safety checks
 */
export async function repinEstateRoadmap(estateId, userId, force = false) {
    const estate = await db.estate.findUnique({
        where: { id: estateId },
        include: {
            taskCompletions: {
                where: { completed: true }
            }
        }
    });
    if (!estate)
        throw new Error(`Estate ${estateId} not found`);
    // SAFETY CHECK: If tasks are completed, block repin unless forced
    if (estate.taskCompletions.length > 0 && !force) {
        throw new Error("REPIN_BLOCKED_COMPLETED_TASKS");
    }
    // TODO: Future - implement migration map for tasks if forced repin
    // For now, we just perform a fresh pin which might shift task IDs
    return pinEstateRoadmap(estateId, userId);
}
/**
 * Unpin roadmap version for an estate
 * This will make the estate use the latest published version
 */
export async function unpinRoadmapVersion(estateId, userId) {
    const estate = await db.estate.findUnique({
        where: { id: estateId },
        select: { id: true }
    });
    if (!estate) {
        throw new Error(`Estate ${estateId} not found`);
    }
    await db.estate.update({
        where: { id: estateId },
        data: {
            roadmapVersion: null,
            roadmapPinnedAt: null
        }
    });
    // Log activity
    await db.settlementActivity.create({
        data: {
            estateId,
            userId,
            type: "ROADMAP",
            action: "VERSION_UNPINNED",
            notes: `Roadmap unpinned - now using latest version`
        }
    });
    return { success: true };
}
/**
 * Get available roadmap versions for a settlement type
 */
export async function getAvailableRoadmapVersions(settlementTypeCode) {
    const versions = await db.roadmapVersion.findMany({
        where: {
            settlementTypeCode,
            isActive: true
        },
        orderBy: { releasedAt: 'desc' },
        select: {
            version: true,
            isPublished: true,
            releasedAt: true,
            changelog: true
        }
    });
    return versions;
}
/**
 * Get task completion status for an estate
 */
export async function getTaskCompletions(estateId) {
    const estate = await db.estate.findUnique({
        where: { id: estateId },
        select: { roadmapProgress: true },
    });
    if (!estate) {
        throw new Error(`Estate ${estateId} not found`);
    }
    const progress = estate.roadmapProgress;
    return {
        completedTaskIds: progress?.completedTaskIds || [],
        completedPhases: progress?.completedPhases || [],
    };
}
/**
 * Mark a task as complete
 */
export async function completeTask(estateId, taskId, userId, notes) {
    // Update granular TaskCompletion record
    const completion = await db.taskCompletion.upsert({
        where: {
            estateId_taskId: {
                estateId,
                taskId,
            },
        },
        update: {
            completed: true,
            completedAt: new Date(),
            completedBy: userId,
            notes,
        },
        create: {
            estateId,
            taskId,
            completed: true,
            completedAt: new Date(),
            completedBy: userId,
            notes,
        },
    });
    // Maintain Legacy JSON progress for backward compatibility
    const estate = await db.estate.findUnique({
        where: { id: estateId },
        select: { roadmapProgress: true },
    });
    if (estate) {
        const progress = estate.roadmapProgress || {
            completedTaskIds: [],
            completedPhases: [],
        };
        if (!progress.completedTaskIds.includes(taskId)) {
            progress.completedTaskIds.push(taskId);
            await db.estate.update({
                where: { id: estateId },
                data: { roadmapProgress: progress },
            });
        }
    }
    // Log activity
    await db.settlementActivity.create({
        data: {
            estateId,
            taskId,
            type: "ROADMAP",
            action: "COMPLETED",
            notes,
            userId,
        },
    });
    // ── Auto-spawn Follow-Up communication if this task has a spawn rule ──────
    const spawnRule = FOLLOW_UP_SPAWN_RULES[taskId];
    if (spawnRule) {
        try {
            const followUpDue = new Date();
            followUpDue.setDate(followUpDue.getDate() + spawnRule.responseWindowDays);
            await db.communication.create({
                data: {
                    estateId,
                    direction: "outbound",
                    type: "LETTER",
                    institutionName: spawnRule.institutionName,
                    subject: spawnRule.subject,
                    notes: `Auto-tracked: Sent as part of roadmap task "${taskId}". Expected response within ${spawnRule.responseWindowDays} days.`,
                    followUpDueAt: followUpDue,
                    occurredAt: new Date(),
                    createdBy: userId,
                },
            });
            // Log the waiting state in the activity trail
            await db.settlementActivity.create({
                data: {
                    estateId,
                    userId,
                    type: "COMMUNICATION",
                    action: "WAITING",
                    notes: `WAITING – ${spawnRule.institutionName} response pending (${spawnRule.subject}). Follow-up due ${followUpDue.toLocaleDateString()}.`,
                },
            });
        }
        catch (spawnErr) {
            // Non-fatal — don't block task completion if follow-up spawn fails
            logger.warn(`[roadmapService] Follow-up spawn failed for task ${taskId} (non-fatal): ${spawnErr?.message}`);
        }
    }
    return { success: true, taskId, completedAt: completion.completedAt };
}
/**
 * Mark a task as incomplete
 */
export async function uncompleteTask(estateId, taskId, userId) {
    // Update granular TaskCompletion record
    await db.taskCompletion.updateMany({
        where: { estateId, taskId },
        data: {
            completed: false,
            completedAt: null,
        },
    });
    // Maintain Legacy JSON progress
    const estate = await db.estate.findUnique({
        where: { id: estateId },
        select: { roadmapProgress: true },
    });
    if (estate) {
        const progress = estate.roadmapProgress || {
            completedTaskIds: [],
            completedPhases: [],
        };
        progress.completedTaskIds = progress.completedTaskIds.filter((id) => id !== taskId);
        await db.estate.update({
            where: { id: estateId },
            data: { roadmapProgress: progress },
        });
    }
    // Log activity
    await db.settlementActivity.create({
        data: {
            estateId,
            taskId,
            type: "ROADMAP",
            action: "UNCOMPLETED",
            userId,
        },
    });
    return { success: true, taskId };
}
