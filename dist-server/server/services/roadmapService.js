import { SETTLEMENT_PHASE_TASKS } from "../../src/config/settlementPhases.js";
import { STATE_PHASE_OVERRIDES, NEUTRAL_PHASE_MILESTONES } from "../../src/config/roadmapMetadata.js";
import { prisma as db } from "../db.js";
import { calculateAuthorityRecommendation } from "../../src/lib/authorityEngine.js";
import { getLettersTerm, getStateRule } from "../../src/lib/stateRules.js";
import { logger } from "../lib/logger.js";
import { CountyOverrideService } from "./countyOverrideService.js";
import { fetchEstateRowById } from "../utils/estateFallback.js";
import { getPrismaErrorDetails, isMissingColumnError } from "../utils/prismaErrors.js";
import { filterPhasesByJurisdiction, filterPhasesByAuthorityScope } from "../../src/shared/filterByJurisdiction.js";
import { deriveEstateAuthorityType } from "../../src/types/authorityScope.js";
import { computeAuthorityRecommendation, checkAuthorityChangePending, } from "./authorityChangeService.js";
import { computeCompletedPhases, computeRoadmapVersionDiff, hashStable, normalizeRoadmapForSnapshot, shouldCreateNewRoadmapVersion, } from "./roadmapVersioning.js";
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
    if (state !== "CA" && Array.isArray(mergedTask.dependencies)) {
        mergedTask.dependencies = mergedTask.dependencies.filter((dep) => !CA_ONLY_TASK_IDS.has(dep));
    }
    const normalizedRequiredDocs = Array.isArray(mergedTask.requiredDocs)
        ? mergedTask.requiredDocs.map((doc) => normalizeTextForState(doc, state) || doc)
        : undefined;
    const normalizedAlerts = Array.isArray(mergedTask.alerts)
        ? mergedTask.alerts.map((alert) => ({
            ...alert,
            message: normalizeTextForState(alert.message, state) || alert.message,
        }))
        : undefined;
    const normalizedLinks = Array.isArray(mergedTask.links)
        ? mergedTask.links.map((link) => ({
            ...link,
            label: normalizeTextForState(link.label, state) || link.label,
        }))
        : undefined;
    const normalizedFormNames = Array.isArray(mergedTask.formNames)
        ? mergedTask.formNames.map((f) => normalizeTextForState(f, state) || f)
        : undefined;
    // Apply text normalization (CA form numbers, Medi-Cal → Medicaid, etc.)
    return {
        ...mergedTask,
        title: normalizeTextForState(mergedTask.title, state) || mergedTask.title,
        description: normalizeTextForState(mergedTask.description, state) || mergedTask.description,
        utility: normalizeTextForState(mergedTask.utility, state),
        rationale: normalizeTextForState(mergedTask.rationale, state),
        conditionalRequirementLabel: normalizeTextForState(mergedTask.conditionalRequirementLabel, state) || mergedTask.conditionalRequirementLabel,
        requiredDocs: normalizedRequiredDocs,
        alerts: normalizedAlerts,
        links: normalizedLinks,
        primaryActionLabel: normalizeTextForState(mergedTask.primaryActionLabel, state),
        formNames: normalizedFormNames
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
function normalizePhasesForState(phases, state, county) {
    return phases.map(phase => {
        // Use canonical resolvePhaseHeader: state → DEFAULT → NEUTRAL → original
        const resolved = resolvePhaseHeader(phase.phase, state);
        return {
            ...phase,
            milestone: resolved.milestone || phase.milestone,
            subtitle: resolved.subtitle || phase.subtitle,
            tasks: phase.tasks.map(task => normalizeTaskForState(task, state, county)).filter((t) => t !== null),
        };
    });
}
function dedupeRoadmapTaskIds(phases, context = {}) {
    const seen = new Set();
    const duplicateTaskIds = new Set();
    const deduped = phases.map((phase) => ({
        ...phase,
        tasks: phase.tasks.filter((task) => {
            if (seen.has(task.id)) {
                duplicateTaskIds.add(task.id);
                return false;
            }
            seen.add(task.id);
            return true;
        }),
    }));
    if (duplicateTaskIds.size > 0) {
        logger.warn({
            estateId: context.estateId,
            state: context.state,
            county: context.county,
            duplicateTaskIds: [...duplicateTaskIds].sort(),
        }, "Dropped duplicate task IDs from generated roadmap");
    }
    return deduped;
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
 * Determine effective authority with governance layers
 * Priority:
 * 1. User selection (highest)
 * 2. High-confidence engine recommendation (>= 70)
 * 3. Low-confidence engine recommendation (< 70)
 * 4. Fail-closed to PROBATE (default)
 */
export function determineEffectiveAuthority(estate, engineRec, confidence, confidenceSignals) {
    // Priority 1: User selection
    if (estate.userSelectedEstateAuthorityType) {
        return {
            estateAuthorityType: estate.userSelectedEstateAuthorityType,
            confidence: 100,
            source: "USER_SELECTION",
            recommendation: "User explicitly selected this track",
            userSelection: estate.userSelectedEstateAuthorityType,
            confidenceSignals,
        };
    }
    // Priority 2: High-confidence engine recommendation
    if (confidence >= 70) {
        return {
            estateAuthorityType: engineRec.estateAuthorityType || deriveEstateAuthorityType(engineRec.activeEngines),
            confidence,
            source: "ENGINE_HIGH_CONFIDENCE",
            recommendation: engineRec.reason,
            confidenceSignals,
        };
    }
    // Priority 3: Low-confidence engine recommendation
    if (confidence > 0) {
        return {
            estateAuthorityType: engineRec.estateAuthorityType || deriveEstateAuthorityType(engineRec.activeEngines),
            confidence,
            source: "ENGINE_LOW_CONFIDENCE",
            recommendation: engineRec.reason,
            confidenceSignals,
        };
    }
    // Priority 4: Fail-closed to PROBATE
    return {
        estateAuthorityType: "PROBATE",
        confidence: 0,
        source: "DEFAULT_FAIL_CLOSED",
        recommendation: "Low confidence in automatic detection - defaulting to PROBATE for safety",
        confidenceSignals,
    };
}
/**
 * Fetch jurisdiction rules from database with fallback to hardcoded defaults
 */
async function getJurisdictionRule(stateCode) {
    try {
        const dbRule = await db.jurisdictionRule.findUnique({
            where: { stateCode }
        });
        if (dbRule)
            return dbRule;
    }
    catch (error) {
        logger.warn({
            stateCode,
            message: error instanceof Error ? error.message : String(error),
            ...getPrismaErrorDetails(error)
        }, "Jurisdiction rule query failed. Falling back to static state rules.");
    }
    // Fallback to hardcoded defaults from stateRules.ts
    const { STATE_RULES } = await import("../../src/lib/stateRules.js");
    return STATE_RULES[stateCode] || STATE_RULES["CA"];
}
const fetchEstateWithRelations = async (estateId) => {
    try {
        return await db.estate.findUnique({
            where: { id: estateId },
            select: {
                id: true,
                deceasedState: true,
                hasWill: true,
                hasMinorBeneficiaries: true,
                hasContest: true,
                isTrustRevocable: true,
                isOutOfState: true,
                isSurvivingSpouse: true,
                hasTODDeed: true,
                estimatedPersonalProperty: true,
                estimatedRealProperty: true,
                hasUnknownHeirs: true,
                internationalReasons: true,
                hasPrimaryResidence: true,
                userSelectedEstateAuthorityType: true,
                authorityType: true,
                estateAuthorityType: true,
                authorityPinnedAt: true,
                heirs: {
                    select: {
                        id: true,
                        name: true,
                        relationship: true,
                        isAdult: true,
                        address: true,
                        email: true,
                        phone: true,
                    },
                },
                assets: {
                    select: {
                        id: true,
                        assetType: true,
                        value: true,
                        todDeedRecorded: true,
                    },
                },
                liabilities: {
                    select: {
                        id: true,
                        amount: true,
                    },
                },
            },
        });
    }
    catch (error) {
        if (!isMissingColumnError(error)) {
            throw error;
        }
        logger.warn({
            estateId,
            message: error instanceof Error ? error.message : String(error),
            ...getPrismaErrorDetails(error)
        }, "Estate profile query failed due to missing columns. Using fallback estate fetch.");
        const fallbackEstate = await fetchEstateRowById(db, estateId);
        if (!fallbackEstate)
            return null;
        const [heirs, assets, liabilities] = await Promise.all([
            db.heir.findMany({ where: { estateId } }),
            db.asset.findMany({ where: { estateId } }),
            db.liability.findMany({ where: { estateId } })
        ]);
        return {
            id: typeof fallbackEstate.id === "string" ? fallbackEstate.id : estateId,
            deceasedState: typeof fallbackEstate.deceasedState === "string" ? fallbackEstate.deceasedState : null,
            hasWill: typeof fallbackEstate.hasWill === "boolean" ? fallbackEstate.hasWill : false,
            hasMinorBeneficiaries: typeof fallbackEstate.hasMinorBeneficiaries === "boolean" ? fallbackEstate.hasMinorBeneficiaries : false,
            hasContest: typeof fallbackEstate.hasContest === "boolean" ? fallbackEstate.hasContest : false,
            hasPrimaryResidence: typeof fallbackEstate.hasPrimaryResidence === "boolean" ? fallbackEstate.hasPrimaryResidence : false,
            hasUnknownHeirs: typeof fallbackEstate.hasUnknownHeirs === "boolean" ? fallbackEstate.hasUnknownHeirs : false,
            internationalReasons: Array.isArray(fallbackEstate.internationalReasons)
                ? fallbackEstate.internationalReasons
                : [],
            isTrustRevocable: typeof fallbackEstate.isTrustRevocable === "boolean" ? fallbackEstate.isTrustRevocable : null,
            isOutOfState: typeof fallbackEstate.isOutOfState === "boolean" ? fallbackEstate.isOutOfState : false,
            isSurvivingSpouse: typeof fallbackEstate.isSurvivingSpouse === "boolean" ? fallbackEstate.isSurvivingSpouse : false,
            hasTODDeed: typeof fallbackEstate.hasTODDeed === "boolean" ? fallbackEstate.hasTODDeed : false,
            userSelectedEstateAuthorityType: typeof fallbackEstate.userSelectedEstateAuthorityType === "string"
                ? fallbackEstate.userSelectedEstateAuthorityType
                : null,
            estimatedPersonalProperty: fallbackEstate.estimatedPersonalProperty ?? null,
            estimatedRealProperty: fallbackEstate.estimatedRealProperty ?? null,
            authorityType: typeof fallbackEstate.authorityType === "string" ? fallbackEstate.authorityType : null,
            estateAuthorityType: typeof fallbackEstate.estateAuthorityType === "string" ? fallbackEstate.estateAuthorityType : null,
            authorityPinnedAt: fallbackEstate.authorityPinnedAt instanceof Date ? fallbackEstate.authorityPinnedAt : null,
            heirs: heirs.map(h => ({ isAdult: !!h.isAdult })),
            assets: assets.map(a => ({
                value: a.value,
                todDeedRecorded: !!a.todDeedRecorded,
                assetType: a.assetType ?? "",
            })),
            liabilities: liabilities.map(l => ({ amount: l.amount })),
        };
    }
};
/**
 * Analyze estate to determine which optional tasks should be shown
 */
export async function analyzeEstateProfile(estateId) {
    // Fetch estate with related data - defensive query to handle missing columns
    let estate;
    try {
        estate = await db.estate.findUnique({
            where: { id: estateId },
            include: {
                heirs: true,
                assets: true,
                liabilities: true,
            },
        });
    }
    catch (error) {
        const errorMessage = error.message || '';
        if (errorMessage.includes('column') && (errorMessage.includes('does not exist') || errorMessage.includes('Unknown column'))) {
            logger.error({
                estateId,
                error: errorMessage
            }, "CRITICAL: Database schema mismatch in analyzeEstateProfile - missing column");
            // Return a minimal profile that allows the app to function
            throw new Error("SCHEMA_MIGRATION_REQUIRED");
        }
        throw error;
    }
    if (!estate) {
        throw new Error(`Estate ${estateId} not found`);
    }
    const normalizedState = typeof estate.deceasedState === "string" ? estate.deceasedState.trim().toUpperCase() : "";
    if (!normalizedState || !/^[A-Z]{2}$/.test(normalizedState)) {
        logger.warn({ estateId, deceasedState: estate.deceasedState }, "Estate has missing or invalid state code — STATE_REQUIRED");
        throw new Error("STATE_REQUIRED");
    }
    // Fetch state-specific rules from DB
    const stateRule = await getJurisdictionRule(normalizedState);
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
    const rec = calculateAuthorityRecommendation(estate.assets, normalizedState, {
        hasWill: estate.hasWill,
        // isTrustRevocable: schema field (nullable Boolean). undefined = no trust / not known.
        isTrustRevocable: estate.isTrustRevocable ?? undefined,
        isOutOfState: estate.isOutOfState ?? false,
        // isSurvivingSpouse: used for spousal petition routing
        isSpouse: estate.isSurvivingSpouse ?? false,
        hasMinors: estate.hasMinorBeneficiaries || estate.heirs.some(h => !h.isAdult),
        hasContest: estate.hasContest,
        hasTODDeed: estate.hasTODDeed ?? estate.assets.some(a => a.todDeedRecorded),
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
    const stateCode = normalizedState;
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
    // Compute estateAuthorityType from activeEngines
    const estateAuthorityType = deriveEstateAuthorityType(rec.activeEngines);
    // Determine effective authority with governance
    const effectiveAuthority = determineEffectiveAuthority(estate, rec, rec.confidence || 0, rec.confidenceSignals);
    return {
        id: estate.id,
        hasMinorBeneficiaries: rec.modifiers?.includes("MINOR_HEIRS") || false,
        isSmallEstate: rec.isEligibleForSmallEstate,
        isPrimaryResidence: estate.hasPrimaryResidence || estate.assets.some(a => a.assetType === "real_estate"),
        isContested: rec.modifiers?.includes("CONTESTED") || false,
        state: normalizedState,
        estimatedValue: rec.probateTotal,
        totalDebts,
        solvencyRatio,
        assetCount: estate.assets.length,
        liabilityCount: estate.liabilities.length,
        authoritySource: rec.authoritySource,
        procedureType: rec.procedureType,
        distributionModel: rec.distributionModel,
        activeEngines: rec.activeEngines,
        estateAuthorityType, // Computed from activeEngines for authority scope filtering
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
        // Effective authority governance
        effectiveAuthority,
    };
}
/**
 * Filter tasks based on estate profile and exclusivity
 */
export function filterTasksForEstate(allTasks, profile, completedTaskIds = [], county) {
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
            const mergedTask = resolveTaskForState(task, profile.state, county);
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
        tasks: phaseList.tasks.map(t => normalizeTaskForState(t, profile.state, county))
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
 * Estate roadmap snapshot versioning helpers
 */
function isEstateRoadmapVersioningUnavailable(error) {
    const message = error instanceof Error ? error.message : String(error || "");
    const lowered = message.toLowerCase();
    return (lowered.includes("estate_roadmap_versions") &&
        (lowered.includes("does not exist") || lowered.includes("unknown table") || lowered.includes("no such table")));
}
function getEstateRoadmapVersionDelegate(client) {
    const delegate = client?.estateRoadmapVersion;
    if (!delegate || typeof delegate.findFirst !== "function") {
        return null;
    }
    return delegate;
}
function getSettlementTypeCodeForProfile(profile, estate) {
    return profile.procedureType !== "UNSET"
        ? profile.procedureType
        : (estate.settlementPath || estate.estateType || "FORMAL_PROBATE");
}
function buildEstateRoadmapInputSnapshot(params) {
    const { profile, settlementTypeCode, estate } = params;
    return {
        deceasedState: (estate.deceasedState || profile.state || "").toUpperCase(),
        probateCounty: estate.probateCounty || null,
        settlementTypeCode,
        estateAuthorityType: profile.estateAuthorityType,
        procedureType: profile.procedureType,
        distributionModel: profile.distributionModel,
        activeEngines: [...profile.activeEngines].sort(),
        hasWill: !!profile.hasWill,
        hasMinorBeneficiaries: !!profile.hasMinorBeneficiaries,
        hasContest: !!profile.isContested,
        hasUnknownHeirs: !!profile.hasUnknownHeirs,
        hasPrimaryResidence: !!profile.isPrimaryResidence,
        estimatedValue: Number(profile.estimatedValue || 0),
        totalDebts: Number(profile.totalDebts || 0),
        solvencyRatio: Number(profile.solvencyRatio || 0),
        assetCount: Number(profile.assetCount || 0),
        liabilityCount: Number(profile.liabilityCount || 0),
        stateRulesetHash: estate.stateRulesetHash || null,
        countyOverrideHash: estate.countyOverrideHash || null,
        ssotRoadmapVersion: estate.roadmapVersion || null,
    };
}
function parseSnapshotPhases(snapshot) {
    if (!Array.isArray(snapshot))
        return [];
    return snapshot;
}
function normalizeEstateRoadmapVersionRecord(row) {
    return {
        id: row.id,
        estateId: row.estateId,
        versionNumber: Number(row.versionNumber),
        versionLabel: row.versionLabel,
        status: row.status,
        generationReason: row.generationReason,
        inputSnapshot: (row.inputSnapshot || null),
        inputHash: row.inputHash,
        roadmapSnapshot: parseSnapshotPhases(row.roadmapSnapshot),
        roadmapHash: row.roadmapHash,
        changeSummary: (row.changeSummary || null),
        createdBy: row.createdBy,
        supersededAt: row.supersededAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
function buildInitialVersionDiff(phases, completedTaskIds) {
    const visibleTaskIds = phases.flatMap((phase) => phase.tasks.map((task) => task.id));
    const visibleTaskIdSet = new Set(visibleTaskIds);
    const carriedCompletedTaskIds = completedTaskIds
        .filter((taskId) => visibleTaskIdSet.has(taskId))
        .sort();
    const carriedSet = new Set(carriedCompletedTaskIds);
    const invalidatedCompletedTaskIds = completedTaskIds
        .filter((taskId) => !carriedSet.has(taskId))
        .sort();
    return {
        addedTaskIds: [],
        removedTaskIds: [],
        changedTaskIds: [],
        unchangedTaskIds: [...new Set(visibleTaskIds)].sort(),
        carriedCompletedTaskIds,
        invalidatedCompletedTaskIds,
        changedInputFields: ["INITIAL_SNAPSHOT"],
        triggerReasons: ["INITIAL_GENERATION"],
    };
}
async function applyRoadmapCompletionRevalidation(params) {
    const { client, estateId, phases, currentProgress, carriedCompletedTaskIds, invalidatedCompletedTaskIds, } = params;
    const nextCompletedTaskIds = [...new Set(carriedCompletedTaskIds)].sort();
    const nextCompletedPhases = computeCompletedPhases(phases, nextCompletedTaskIds);
    await client.estate.update({
        where: { id: estateId },
        data: {
            roadmapProgress: {
                ...(currentProgress || {}),
                completedTaskIds: nextCompletedTaskIds,
                completedPhases: nextCompletedPhases,
            },
        },
    });
    if (invalidatedCompletedTaskIds.length > 0) {
        await client.taskCompletion.updateMany({
            where: {
                estateId,
                taskId: { in: invalidatedCompletedTaskIds },
            },
            data: {
                completed: false,
                completedAt: null,
            },
        });
    }
}
async function ensureEstateRoadmapVersion(params) {
    const { estateId, profile, phases, completedTaskIds, forceNewVersion = false, actorUserId, generationReason, } = params;
    const delegate = getEstateRoadmapVersionDelegate(db);
    if (!delegate) {
        return {
            versioningEnabled: false,
            createdNewVersion: false,
            activeVersion: null,
            diff: null,
        };
    }
    let estateMeta;
    try {
        estateMeta = await db.estate.findUnique({
            where: { id: estateId },
            select: {
                id: true,
                deceasedState: true,
                probateCounty: true,
                estateType: true,
                settlementPath: true,
                roadmapVersion: true,
                stateRulesetHash: true,
                countyOverrideHash: true,
                roadmapProgress: true,
            },
        });
    }
    catch (error) {
        if (isMissingColumnError(error)) {
            const fallback = await fetchEstateRowById(db, estateId);
            estateMeta = fallback
                ? {
                    id: fallback.id,
                    deceasedState: fallback.deceasedState ?? profile.state,
                    probateCounty: fallback.probateCounty ?? null,
                    estateType: fallback.estateType ?? null,
                    settlementPath: fallback.settlementPath ?? null,
                    roadmapVersion: fallback.roadmapVersion ?? null,
                    stateRulesetHash: fallback.stateRulesetHash ?? null,
                    countyOverrideHash: fallback.countyOverrideHash ?? null,
                    roadmapProgress: fallback.roadmapProgress ?? null,
                }
                : null;
        }
        else {
            throw error;
        }
    }
    if (!estateMeta) {
        throw new Error(`Estate ${estateId} not found`);
    }
    const settlementTypeCode = getSettlementTypeCodeForProfile(profile, estateMeta);
    const nextInputSnapshot = buildEstateRoadmapInputSnapshot({
        profile,
        settlementTypeCode,
        estate: estateMeta,
    });
    const nextInputHash = hashStable(nextInputSnapshot);
    const nextRoadmapSnapshot = normalizeRoadmapForSnapshot(phases);
    const nextRoadmapHash = hashStable(nextRoadmapSnapshot);
    try {
        return await db.$transaction(async (tx) => {
            const txDelegate = getEstateRoadmapVersionDelegate(tx);
            if (!txDelegate) {
                return {
                    versioningEnabled: false,
                    createdNewVersion: false,
                    activeVersion: null,
                    diff: null,
                };
            }
            const activeRaw = await txDelegate.findFirst({
                where: { estateId, status: "ACTIVE" },
                orderBy: { versionNumber: "desc" },
            });
            if (!activeRaw) {
                const initialDiff = buildInitialVersionDiff(phases, completedTaskIds);
                const created = await txDelegate.create({
                    data: {
                        estateId,
                        versionNumber: 1,
                        versionLabel: "v1",
                        status: "ACTIVE",
                        generationReason: generationReason || "INITIAL_GENERATION",
                        inputSnapshot: nextInputSnapshot,
                        inputHash: nextInputHash,
                        roadmapSnapshot: nextRoadmapSnapshot,
                        roadmapHash: nextRoadmapHash,
                        changeSummary: initialDiff,
                        createdBy: actorUserId || null,
                    },
                });
                await applyRoadmapCompletionRevalidation({
                    client: tx,
                    estateId,
                    phases,
                    currentProgress: estateMeta.roadmapProgress,
                    carriedCompletedTaskIds: initialDiff.carriedCompletedTaskIds,
                    invalidatedCompletedTaskIds: initialDiff.invalidatedCompletedTaskIds,
                });
                return {
                    versioningEnabled: true,
                    createdNewVersion: true,
                    activeVersion: normalizeEstateRoadmapVersionRecord(created),
                    diff: initialDiff,
                };
            }
            const activeVersion = normalizeEstateRoadmapVersionRecord(activeRaw);
            const diff = computeRoadmapVersionDiff({
                previousPhases: activeVersion.roadmapSnapshot,
                nextPhases: phases,
                completedTaskIds,
                previousInputSnapshot: activeVersion.inputSnapshot,
                nextInputSnapshot,
            });
            const shouldCreate = shouldCreateNewRoadmapVersion({
                previousInputHash: activeVersion.inputHash,
                nextInputHash,
                previousRoadmapHash: activeVersion.roadmapHash,
                nextRoadmapHash,
                force: forceNewVersion,
            });
            if (!shouldCreate) {
                return {
                    versioningEnabled: true,
                    createdNewVersion: false,
                    activeVersion,
                    diff,
                };
            }
            const nextVersionNumber = Number(activeVersion.versionNumber) + 1;
            const nextVersionLabel = `v${nextVersionNumber}`;
            await txDelegate.updateMany({
                where: { estateId, status: "ACTIVE" },
                data: {
                    status: "SUPERSEDED",
                    supersededAt: new Date(),
                },
            });
            const created = await txDelegate.create({
                data: {
                    estateId,
                    versionNumber: nextVersionNumber,
                    versionLabel: nextVersionLabel,
                    status: "ACTIVE",
                    generationReason: generationReason || (forceNewVersion ? "MANUAL_REGENERATION" : "MATERIAL_CHANGE"),
                    inputSnapshot: nextInputSnapshot,
                    inputHash: nextInputHash,
                    roadmapSnapshot: nextRoadmapSnapshot,
                    roadmapHash: nextRoadmapHash,
                    changeSummary: diff,
                    createdBy: actorUserId || null,
                },
            });
            await applyRoadmapCompletionRevalidation({
                client: tx,
                estateId,
                phases,
                currentProgress: estateMeta.roadmapProgress,
                carriedCompletedTaskIds: diff.carriedCompletedTaskIds,
                invalidatedCompletedTaskIds: diff.invalidatedCompletedTaskIds,
            });
            if (diff.invalidatedCompletedTaskIds.length > 0) {
                await tx.settlementActivity.create({
                    data: {
                        estateId,
                        userId: actorUserId || null,
                        type: "ROADMAP",
                        action: "VERSION_REVALIDATION",
                        notes: `Roadmap ${nextVersionLabel} invalidated ${diff.invalidatedCompletedTaskIds.length} completed tasks due to material changes.`,
                    },
                });
            }
            return {
                versioningEnabled: true,
                createdNewVersion: true,
                activeVersion: normalizeEstateRoadmapVersionRecord(created),
                diff,
            };
        });
    }
    catch (error) {
        if (isEstateRoadmapVersioningUnavailable(error)) {
            logger.warn({ estateId, error: error instanceof Error ? error.message : String(error) }, "Roadmap version snapshot table unavailable; continuing without snapshot versioning.");
            return {
                versioningEnabled: false,
                createdNewVersion: false,
                activeVersion: null,
                diff: null,
            };
        }
        throw error;
    }
}
export async function getEstateRoadmapVersionHistory(estateId) {
    const delegate = getEstateRoadmapVersionDelegate(db);
    if (!delegate)
        return [];
    try {
        const rows = await delegate.findMany({
            where: { estateId },
            orderBy: { versionNumber: "desc" },
            select: {
                id: true,
                versionNumber: true,
                versionLabel: true,
                status: true,
                generationReason: true,
                createdAt: true,
                supersededAt: true,
                changeSummary: true,
            },
        });
        return rows.map((row) => ({
            id: row.id,
            versionNumber: Number(row.versionNumber),
            versionLabel: row.versionLabel,
            status: row.status,
            generationReason: row.generationReason,
            createdAt: row.createdAt,
            supersededAt: row.supersededAt,
            changeSummary: (row.changeSummary || null),
        }));
    }
    catch (error) {
        if (isEstateRoadmapVersioningUnavailable(error)) {
            return [];
        }
        throw error;
    }
}
export async function activateEstateRoadmapVersion(estateId, versionId, userId) {
    const delegate = getEstateRoadmapVersionDelegate(db);
    if (!delegate) {
        throw new Error("ROADMAP_VERSIONING_UNAVAILABLE");
    }
    try {
        return await db.$transaction(async (tx) => {
            const txDelegate = getEstateRoadmapVersionDelegate(tx);
            if (!txDelegate) {
                throw new Error("ROADMAP_VERSIONING_UNAVAILABLE");
            }
            const [targetRaw, activeRaw, estate] = await Promise.all([
                txDelegate.findFirst({ where: { id: versionId, estateId } }),
                txDelegate.findFirst({ where: { estateId, status: "ACTIVE" }, orderBy: { versionNumber: "desc" } }),
                tx.estate.findUnique({ where: { id: estateId }, select: { roadmapProgress: true } }),
            ]);
            if (!targetRaw) {
                throw new Error("ROADMAP_VERSION_NOT_FOUND");
            }
            if (!estate) {
                throw new Error(`Estate ${estateId} not found`);
            }
            const target = normalizeEstateRoadmapVersionRecord(targetRaw);
            const active = activeRaw ? normalizeEstateRoadmapVersionRecord(activeRaw) : null;
            const completedTaskIds = (estate.roadmapProgress?.completedTaskIds || []);
            const diff = computeRoadmapVersionDiff({
                previousPhases: active?.roadmapSnapshot || null,
                nextPhases: target.roadmapSnapshot,
                completedTaskIds,
                previousInputSnapshot: active?.inputSnapshot || null,
                nextInputSnapshot: target.inputSnapshot || {},
            });
            if (!active || active.id !== target.id) {
                await txDelegate.updateMany({
                    where: { estateId, status: "ACTIVE" },
                    data: {
                        status: "SUPERSEDED",
                        supersededAt: new Date(),
                    },
                });
                await txDelegate.update({
                    where: { id: target.id },
                    data: {
                        status: "ACTIVE",
                        supersededAt: null,
                    },
                });
            }
            await applyRoadmapCompletionRevalidation({
                client: tx,
                estateId,
                phases: target.roadmapSnapshot,
                currentProgress: estate.roadmapProgress,
                carriedCompletedTaskIds: diff.carriedCompletedTaskIds,
                invalidatedCompletedTaskIds: diff.invalidatedCompletedTaskIds,
            });
            await tx.settlementActivity.create({
                data: {
                    estateId,
                    userId,
                    type: "ROADMAP",
                    action: "VERSION_ACTIVATED",
                    notes: `Activated roadmap ${target.versionLabel}. Revalidated ${diff.invalidatedCompletedTaskIds.length} completed tasks.`,
                },
            });
            const refreshed = await txDelegate.findUnique({ where: { id: target.id } });
            return {
                success: true,
                activeVersion: normalizeEstateRoadmapVersionRecord(refreshed),
                diff,
            };
        });
    }
    catch (error) {
        if (isEstateRoadmapVersioningUnavailable(error)) {
            throw new Error("ROADMAP_VERSIONING_UNAVAILABLE");
        }
        throw error;
    }
}
/**
 * Get roadmap from database based on estate's settlement type
 * Supports estate-time pinning via roadmapVersion field
 */
export async function getRoadmapFromDatabase(estateId, profile, completedTaskIds) {
    // Get estate to determine settlement type and version pinning
    let estate = null;
    try {
        estate = await db.estate.findUnique({
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
    }
    catch (error) {
        if (!isMissingColumnError(error)) {
            throw error;
        }
        logger.warn({
            estateId,
            message: error instanceof Error ? error.message : String(error),
            ...getPrismaErrorDetails(error)
        }, "Roadmap metadata query failed due to missing columns. Using fallback estate data.");
        const fallbackEstate = await fetchEstateRowById(db, estateId);
        estate = fallbackEstate
            ? {
                estateType: fallbackEstate.estateType ?? null,
                settlementPath: fallbackEstate.settlementPath ?? null,
                roadmapVersion: fallbackEstate.roadmapVersion ?? null,
                roadmapPinnedAt: fallbackEstate.roadmapPinnedAt ?? null,
                probateCounty: fallbackEstate.probateCounty ?? null,
                countyOverrideHash: fallbackEstate.countyOverrideHash ?? null
            }
            : null;
    }
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
    let settlementType;
    try {
        settlementType = await db.settlementType.findUnique({
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
    }
    catch (error) {
        logger.warn({
            estateId,
            settlementTypeCode,
            error: error instanceof Error ? error.message : String(error)
        }, "Failed to fetch settlement type - likely due to missing migration. Falling back to hardcoded tasks.");
        // Fallback to hardcoded tasks if query fails
        const injected = ensurePreFilingCompliance(SETTLEMENT_PHASE_TASKS, profile);
        const filtered = filterTasksForEstate(injected, profile, completedTaskIds, estate.probateCounty || undefined);
        const caGuarded = removeCAOnlyTasks(filtered, profile.state);
        const deduped = dedupeRoadmapTaskIds(caGuarded, {
            estateId,
            state: profile.state,
            county: estate.probateCounty || undefined,
        });
        return normalizePhasesForState(deduped, profile.state, estate.probateCounty || undefined);
    }
    if (!settlementType) {
        logger.warn(`Settlement type ${settlementTypeCode} not found in database, falling back to hardcoded SETTLEMENT_PHASE_TASKS`);
        // Fallback to hardcoded tasks if type not found
        const injected = ensurePreFilingCompliance(SETTLEMENT_PHASE_TASKS, profile);
        const filtered = filterTasksForEstate(injected, profile, completedTaskIds, estate.probateCounty || undefined);
        const caGuarded = removeCAOnlyTasks(filtered, profile.state);
        const deduped = dedupeRoadmapTaskIds(caGuarded, {
            estateId,
            state: profile.state,
            county: estate.probateCounty || undefined,
        });
        return normalizePhasesForState(deduped, profile.state, estate.probateCounty || undefined);
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
                authorityScope: task.authorityScope,
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
    const filtered = filterTasksForEstate(injected, profile, completedTaskIds, estate.probateCounty || undefined);
    // Apply unified jurisdiction filter (fail-closed scope check)
    const { phases: scopeFiltered, dropped: jurisdictionDropped } = filterPhasesByJurisdiction(filtered, profile.state, estate.probateCounty || undefined);
    // Apply authorityScope filtering (ROOT-CAUSE filter for trust/probate module leakage)
    const { phases: authorityFiltered, dropped: authorityDropped } = filterPhasesByAuthorityScope(scopeFiltered, profile.estateAuthorityType);
    if (authorityDropped.length > 0) {
        logger.info({
            estateId: profile.id,
            estateAuthorityType: profile.estateAuthorityType,
            droppedTasks: authorityDropped.map(d => d.id),
            reasons: authorityDropped.map(d => d.reason)
        }, "Authority scope filtering applied");
    }
    // Apply county overrides with pinning awareness
    let finalizedPhases = authorityFiltered;
    if (estate.probateCounty && estate.probateCounty.trim() !== "") {
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
    const deduped = dedupeRoadmapTaskIds(caGuarded, {
        estateId,
        state: profile.state,
        county: estate.probateCounty || undefined,
    });
    return normalizePhasesForState(deduped, profile.state, estate.probateCounty || undefined);
}
/**
 * Get personalized roadmap for an estate
 */
export async function getEstateRoadmap(estateId) {
    logger.info({ estateId }, "Generating estate roadmap");
    // Analyze estate profile
    let profile;
    try {
        profile = await analyzeEstateProfile(estateId);
        logger.info({ estateId, state: profile.state, procedureType: profile.procedureType }, "Estate profile analyzed");
    }
    catch (error) {
        if (error.message === 'SCHEMA_MIGRATION_REQUIRED') {
            logger.error({ estateId }, "Cannot generate roadmap - schema migration required");
            // Return a minimal response that indicates migration is needed
            throw new Error("SCHEMA_MIGRATION_REQUIRED");
        }
        logger.error({ estateId, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, "Failed to analyze estate profile for roadmap");
        throw error;
    }
    // Get current progress
    const { completedTaskIds } = await getTaskCompletions(estateId);
    // Get roadmap from database (with fallback to hardcoded tasks)
    let filteredPhases;
    try {
        filteredPhases = await getRoadmapFromDatabase(estateId, profile, completedTaskIds);
        logger.info({ estateId, phaseCount: filteredPhases.length }, "Roadmap phases resolved from database");
    }
    catch (error) {
        logger.error({ estateId, state: profile.state, procedureType: profile.procedureType, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, "Failed to get roadmap from database");
        throw error;
    }
    // Development-time contamination check: warn if CA tokens leaked into non-CA state
    validateNoStateContamination(filteredPhases, profile.state);
    let roadmapVersioning = {
        versioningEnabled: false,
        createdNewVersion: false,
        activeVersion: null,
        diff: null,
    };
    try {
        roadmapVersioning = await ensureEstateRoadmapVersion({
            estateId,
            profile,
            phases: filteredPhases,
            completedTaskIds,
        });
    }
    catch (error) {
        logger.error({
            estateId,
            error: error instanceof Error ? error.message : String(error),
        }, "Roadmap versioning sync failed. Continuing with roadmap response.");
    }
    // Get estate for version info and authority status
    let estate;
    try {
        estate = await db.estate.findUnique({
            where: { id: estateId },
            select: {
                roadmapVersion: true,
                roadmapPinnedAt: true,
                authorityPinnedAt: true,
                authorityChangePending: true,
                recommendedAuthorityType: true,
                recommendedAuthorityReason: true,
            }
        });
    }
    catch (error) {
        const errorMessage = error.message || '';
        if (errorMessage.includes('column') && (errorMessage.includes('does not exist') || errorMessage.includes('Unknown column'))) {
            logger.warn({ estateId, error: errorMessage }, "Missing columns when fetching estate for roadmap - using defaults");
            estate = null;
        }
        else {
            throw error;
        }
    }
    // Check if authority change is pending (if estate is pinned)
    let authorityChangePending = estate?.authorityChangePending ?? false;
    let requiresRepin = false;
    let recommendedAuthorityType;
    let recommendedEstateAuthorityType;
    if (estate?.authorityPinnedAt) {
        // Check if recommendation has drifted
        const hasChanged = await checkAuthorityChangePending(estateId);
        authorityChangePending = hasChanged;
        requiresRepin = hasChanged;
        if (hasChanged) {
            // Fetch the recommendation details
            const recommendation = await computeAuthorityRecommendation(estateId);
            recommendedAuthorityType = recommendation.recommendedAuthorityType;
            recommendedEstateAuthorityType = recommendation.recommendedEstateAuthorityType;
        }
    }
    // Return roadmap with triggers
    const effectiveAuthority = profile.effectiveAuthority;
    const activeRoadmapRevision = roadmapVersioning.activeVersion;
    const revisionDiff = roadmapVersioning.diff || activeRoadmapRevision?.changeSummary || null;
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
        version: activeRoadmapRevision?.versionLabel || estate?.roadmapVersion || 'latest',
        pinnedAt: estate?.roadmapPinnedAt,
        // Authority change policy fields
        authorityChangePending,
        requiresRepin,
        recommendedAuthorityType,
        recommendedEstateAuthorityType,
        // Track selection governance fields
        estateAuthorityType: effectiveAuthority.estateAuthorityType,
        authorityConfidence: effectiveAuthority.confidence,
        authoritySource: effectiveAuthority.source,
        authorityRecommendation: effectiveAuthority.recommendation,
        userSelectedAuthorityType: effectiveAuthority.userSelection,
        requiresTrackSelection: effectiveAuthority.source === "DEFAULT_FAIL_CLOSED" || effectiveAuthority.source === "ENGINE_LOW_CONFIDENCE",
        roadmapRevision: activeRoadmapRevision
            ? {
                id: activeRoadmapRevision.id,
                versionNumber: activeRoadmapRevision.versionNumber,
                versionLabel: activeRoadmapRevision.versionLabel,
                status: activeRoadmapRevision.status,
                generationReason: activeRoadmapRevision.generationReason,
                generatedAt: activeRoadmapRevision.createdAt,
                createdNewVersion: roadmapVersioning.createdNewVersion,
                triggerReasons: revisionDiff?.triggerReasons || [],
                changedInputFields: revisionDiff?.changedInputFields || [],
                addedTaskIds: revisionDiff?.addedTaskIds || [],
                removedTaskIds: revisionDiff?.removedTaskIds || [],
                changedTaskIds: revisionDiff?.changedTaskIds || [],
                carriedCompletedTaskIds: revisionDiff?.carriedCompletedTaskIds || [],
                invalidatedCompletedTaskIds: revisionDiff?.invalidatedCompletedTaskIds || [],
            }
            : undefined,
        versioningEnabled: roadmapVersioning.versioningEnabled,
    };
}
/**
 * Pin roadmap for an estate
 * Sets all hashes and version to freeze the current roadmap.
 * Also pins the authority type for stability.
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
    // 3. Determine authority type to pin
    const authorityType = profile.activeEngines.includes("TRUST") ? "TRUST_ADMIN_REVOCABLE" : profile.procedureType;
    const estateAuthorityType = profile.estateAuthorityType;
    // Defensive: try to update with estateAuthorityType, fall back if column doesn't exist
    try {
        await db.estate.update({
            where: { id: estateId },
            data: {
                roadmapVersion: version,
                roadmapPinnedAt: pinnedAt,
                stateRulesetHash,
                countyOverrideHash,
                // Pin authority type for stability
                authorityType,
                estateAuthorityType,
                authorityTypeSource: "PINNED",
                authorityPinnedAt: pinnedAt,
                authorityChangePending: false,
                recommendedAuthorityType: null,
                recommendedAuthorityReason: null,
            }
        });
    }
    catch (error) {
        // Fallback: if estateAuthorityType column doesn't exist, try without it
        logger.warn({
            estateId,
            error: error instanceof Error ? error.message : String(error)
        }, "Failed to update estateAuthorityType - migration may be pending. Retrying without estateAuthorityType.");
        await db.estate.update({
            where: { id: estateId },
            data: {
                roadmapVersion: version,
                roadmapPinnedAt: pinnedAt,
                stateRulesetHash,
                countyOverrideHash,
                // Pin authority type for stability (without estateAuthorityType column)
                authorityType,
                authorityTypeSource: "PINNED",
                authorityPinnedAt: pinnedAt,
                authorityChangePending: false,
                recommendedAuthorityType: null,
                recommendedAuthorityReason: null,
            }
        });
    }
    try {
        const completions = await getTaskCompletions(estateId);
        const snapshotPhases = await getRoadmapFromDatabase(estateId, profile, completions.completedTaskIds);
        await ensureEstateRoadmapVersion({
            estateId,
            profile,
            phases: snapshotPhases,
            completedTaskIds: completions.completedTaskIds,
            forceNewVersion: true,
            actorUserId: userId,
            generationReason: "MANUAL_PIN",
        });
    }
    catch (snapshotError) {
        logger.warn({
            estateId,
            error: snapshotError instanceof Error ? snapshotError.message : String(snapshotError)
        }, "Failed to force snapshot version during pin. Continuing.");
    }
    // Log activity
    await db.settlementActivity.create({
        data: {
            estateId,
            userId,
            type: "ROADMAP",
            action: "PINNED",
            notes: `Roadmap pinned to version ${version} (Ruleset: ${stateRulesetHash?.substring(0, 8)}, Authority: ${authorityType})`
        }
    });
    return { success: true, version, pinnedAt };
}
/**
 * Repin roadmap version for an estate with safety checks
 * Integrates with authority change service for explicit confirmation workflow
 */
export async function repinEstateRoadmap(estateId, userId, force = false) {
    const estate = await db.estate.findUnique({
        where: { id: estateId },
        select: {
            id: true,
            taskCompletions: {
                where: { completed: true },
                select: {
                    id: true,
                    taskId: true,
                    completed: true,
                },
            },
        },
    });
    if (!estate)
        throw new Error(`Estate ${estateId} not found`);
    // SAFETY CHECK: If tasks are completed, block repin unless forced
    if (estate.taskCompletions.length > 0 && !force) {
        throw new Error("REPIN_BLOCKED_COMPLETED_TASKS");
    }
    // Import repin functions from authority change service
    const { repinAuthorityType, getRepinPreview } = await import("./authorityChangeService.js");
    // Get preview of what would change
    const preview = await getRepinPreview(estateId);
    // If authority change requires confirmation and we're not forcing, check
    if (preview.requiresConfirmation && !force) {
        throw new Error("REPIN_REQUIRES_CONFIRMATION");
    }
    // Perform the repin
    const repinResult = await repinAuthorityType(estateId, userId, force);
    if (!repinResult.success && repinResult.requiresConfirmation) {
        throw new Error("REPIN_REQUIRES_CONFIRMATION");
    }
    // Also repin the roadmap version
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
