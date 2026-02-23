import { SETTLEMENT_PHASE_TASKS, PhaseTaskList, PhaseTask } from "../../src/config/settlementPhases.js";
import { prisma as db } from "../db.js";
import { calculateAuthorityRecommendation } from "../../src/lib/authorityEngine.js";
import { AuthoritySource, ProcedureType, DistributionModel, getLettersTerm } from "../../src/lib/stateRules.js";
import { logger } from "../lib/logger.js";

// ─────────────────────────────────────────────────────────────────────────────
// Follow-Up Spawn Rules: tasks that auto-create a "waiting on them" entry
// when marked complete. Keyed by task ID.
// ─────────────────────────────────────────────────────────────────────────────
interface FollowUpSpawnRule {
  institutionName: string;
  subject: string;
  responseWindowDays: number;
}

const FOLLOW_UP_SPAWN_RULES: Record<string, FollowUpSpawnRule> = {
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

/**
 * Estate Profile for Task Filtering (Multi-Dimensional Attorney Model)
 */
interface EstateProfile {
  id: string;
  hasMinorBeneficiaries: boolean;
  isSmallEstate: boolean;
  isPrimaryResidence: boolean;
  isContested: boolean;
  state: string;
  estimatedValue: number;
  totalDebts: number;
  solvencyRatio: number;

  // Multi-dimensional Track Data
  authoritySource: AuthoritySource;
  procedureType: ProcedureType;
  distributionModel: DistributionModel;
  activeEngines: string[];
  hasWill: boolean;
  hasUnknownHeirs: boolean;
}

function normalizeTextForState(text: string | undefined, state: string): string | undefined {
  if (!text) return text;
  if (state === "CA") return text;

  const lettersTerm = getLettersTerm(state);
  let out = text;

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

  out = out.replace(/\s{2,}/g, " ").trim();
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static lookup: hardcoded stateOverrides from SETTLEMENT_PHASE_TASKS by task ID.
// DB-loaded tasks don't carry stateOverrides, so we resolve them from this map.
// ─────────────────────────────────────────────────────────────────────────────
const HARDCODED_STATE_OVERRIDES_MAP = new Map<string, PhaseTask['stateOverrides']>();
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
export function resolveTaskForState(
  task: PhaseTask,
  stateCode: string
): PhaseTask | null {
  const base: PhaseTask = { ...task };

  // 1️⃣ Hard gate by applicability.states — return null (excluded) on mismatch
  if (task.applicability?.states && task.applicability.states.length > 0) {
    if (!task.applicability.states.includes(stateCode)) {
      return null;
    }
  }

  // 2️⃣ Apply stateOverrides if present (inline first, then static lookup for DB tasks)
  const override = task.stateOverrides?.[stateCode]
    || HARDCODED_STATE_OVERRIDES_MAP.get(task.id)?.[stateCode];

  if (override) {
    const merged = override as any;
    return {
      ...base,
      ...override,
      alerts: override.alerts ?? base.alerts,
      requiredDocs: merged.requiredDocs ?? base.requiredDocs,
      links: override.links ?? base.links,
      outputs: merged.outputs ?? base.outputs,
    };
  }

  // 3️⃣ If no override, return neutral base
  return base;
}

/**
 * Strict variant — throws on state mismatch.
 * Use in deterministic generation paths: PDF export, snapshot tests, CI.
 */
export function resolveTaskForStateStrict(
  task: PhaseTask,
  stateCode: string
): PhaseTask {
  const result = resolveTaskForState(task, stateCode);
  if (result === null) {
    throw new Error(
      `Task ${task.id} is restricted to states: ${task.applicability?.states?.join(", ")} (current: ${stateCode})`
    );
  }
  return result;
}

/**
 * Full task normalization: resolveTaskForState() merge + text normalization + CA dep cleanup.
 * Returns null if task is excluded for this state.
 */
function normalizeTaskForState(task: PhaseTask, state: string): PhaseTask | null {
  // Resolve state override merge (state-neutral first pattern)
  const mergedTask = resolveTaskForState(task, state);
  if (mergedTask === null) return null; // Task excluded for this state

  // Clean CA-only dependencies for non-CA states
  if (state !== "CA" && mergedTask.dependencies) {
    mergedTask.dependencies = mergedTask.dependencies.filter(
      (dep: string) => !CA_ONLY_TASK_IDS.has(dep)
    );
  }

  // Apply text normalization (CA form numbers, Medi-Cal → Medicaid, etc.)
  return {
    ...mergedTask,
    title: normalizeTextForState(mergedTask.title, state) || mergedTask.title,
    description: normalizeTextForState(mergedTask.description, state) || mergedTask.description,
    utility: normalizeTextForState(mergedTask.utility, state),
    rationale: normalizeTextForState(mergedTask.rationale, state),
    requiredDocs: mergedTask.requiredDocs?.map(doc => normalizeTextForState(doc, state) || doc),
    alerts: mergedTask.alerts?.map(alert => ({
      ...alert,
      message: normalizeTextForState(alert.message, state) || alert.message
    })),
    links: mergedTask.links?.map(link => ({
      ...link,
      label: normalizeTextForState(link.label, state) || link.label
    }))
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// State-specific phase milestone overrides
// Base milestones are state-neutral; each state injects its own procedural triggers.
// ─────────────────────────────────────────────────────────────────────────────
const STATE_PHASE_OVERRIDES: Record<string, Record<string, { milestone?: string; subtitle?: string }>> = {
  NY: {
    creditor_claims: {
      milestone: "After Letters Issued",
      subtitle: "7-Month Exposure Period",
    },
    asset_liquidation: {
      milestone: "Month 6–12",
      subtitle: "Transfer & Sell",
    },
    final_distribution: {
      milestone: "After Accounting & Approvals",
      subtitle: "Settle & Close",
    },
  },
  CA: {
    creditor_claims: {
      milestone: "After Notice Published",
      subtitle: "4-Month Claim Window",
    },
    asset_liquidation: {
      milestone: "After Inventory Filed",
      subtitle: "IAEA / Court-Confirmed Sales",
    },
    final_distribution: {
      milestone: "After Claim Period",
      subtitle: "Estate Closing",
    },
  },
  TX: {
    creditor_claims: {
      milestone: "After Letters Issued",
      subtitle: "Secured & Unsecured Claims (4 Months)",
    },
    final_distribution: {
      milestone: "After Debts Settled",
      subtitle: "Estate In Closing",
    },
  },
  FL: {
    creditor_claims: {
      milestone: "After Letters Issued",
      subtitle: "3-Month Creditor Window",
    },
    final_distribution: {
      milestone: "After Creditor Period Ends",
      subtitle: "Estate In Closing",
    },
  },
  PA: {
    creditor_claims: {
      milestone: "After Letters Issued",
      subtitle: "1-Year Claim Period",
    },
  },
  OH: {
    creditor_claims: {
      milestone: "After Appointment",
      subtitle: "6-Month Claim Period",
    },
  },
  IL: {
    creditor_claims: {
      milestone: "After Letters Issued",
      subtitle: "6-Month Claim Period",
    },
  },
  GA: {
    creditor_claims: {
      milestone: "After Publication",
      subtitle: "3-Month Claim Period",
    },
  },
  NJ: {
    creditor_claims: {
      milestone: "After Letters Issued",
      subtitle: "6-Month Claim Period",
    },
  },
  MA: {
    creditor_claims: {
      milestone: "After Date of Death",
      subtitle: "1-Year Claim Period",
    },
  },
  // ── DEFAULT: state-neutral fallback so renderer never falls back to CA ──
  DEFAULT: {
    creditor_claims: {
      milestone: "After Letters Issued",
      subtitle: "State-Specific Timing",
    },
    asset_liquidation: {
      milestone: "Month 6–12",
      subtitle: "State-Specific Process",
    },
    final_distribution: {
      milestone: "After Accounting & Approvals",
      subtitle: "Closeout",
    },
  },
};

// State-neutral defaults for phases (used when no state override exists)
const NEUTRAL_PHASE_MILESTONES: Record<string, { milestone: string; subtitle: string }> = {
  immediate_actions: { milestone: "Death to Filing", subtitle: "Secure & Notify" },
  pre_filing_compliance: { milestone: "Before Petition Filing", subtitle: "Procedural Checks" },
  court_filing: { milestone: "After Petition Filed", subtitle: "Obtaining Powers" },
  asset_discovery: { milestone: "After Letters Issued", subtitle: "Inventory & Appraisal" },
  creditor_claims: { milestone: "After Letters Issued", subtitle: "Notice & Priority" },
  asset_liquidation: { milestone: "Month 6–12", subtitle: "Transfer & Sell" },
  final_distribution: { milestone: "Month 6–12", subtitle: "Estate In Closing" },
};

// ─────────────────────────────────────────────────────────────────────────────
// CA-only tokens that must NEVER appear for non-CA states
// ─────────────────────────────────────────────────────────────────────────────
const CA_ONLY_TASK_IDS = new Set([
  "prepare_notice_proposed_action",
  "wait_proposed_action_period",
  "petition_confirm_sale",
  "obtain_sale_confirmation_order",
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
export function filterTasksForState(
  tasks: PhaseTask[],
  stateCode: string
): PhaseTask[] {
  return tasks.filter((task) => {
    // Hard gate: CA-only task IDs
    if (CA_ONLY_TASK_IDS.has(task.id)) {
      return stateCode === "CA";
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
  "After Claim Period",
  "Independent Administration",
];

export function validateStateContent(
  renderedText: string,
  stateCode: string
): void {
  if (stateCode === "CA") return;
  for (const token of CA_TOKENS) {
    if (renderedText.includes(token)) {
      throw new Error(
        `State contamination detected: '${token}' found in ${stateCode} roadmap`
      );
    }
  }
}

/**
 * Phase-level contamination check: scans all rendered phases for CA-specific
 * tokens that leaked into non-CA states. Catches and logs (non-fatal at runtime).
 */
function validateNoStateContamination(phases: PhaseTaskList[], state: string): void {
  if (state === "CA") return;
  for (const phase of phases) {
    // Check phase-level metadata
    try {
      if (phase.milestone) validateStateContent(phase.milestone, state);
      if (phase.subtitle) validateStateContent(phase.subtitle, state);
    } catch (err: any) {
      logger.warn(`[roadmapService] ${err.message} (phase="${phase.phase}")`);
    }
    // Check task-level content
    for (const task of phase.tasks) {
      try {
        if (task.title) validateStateContent(task.title, state);
        if (task.description) validateStateContent(task.description, state);
      } catch (err: any) {
        logger.warn(`[roadmapService] ${err.message} (task="${task.id}")`);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Phase Header Override Resolver
// No CA fallback — only state-specific or neutral default.
// Resolution: stateOverrides[state] → DEFAULT → NEUTRAL_PHASE_MILESTONES → {}
// ─────────────────────────────────────────────────────────────────────────────
export function resolvePhaseHeader(
  phaseKey: string,
  stateCode: string
): { milestone?: string; subtitle?: string } {
  const stateOverride = STATE_PHASE_OVERRIDES[stateCode]?.[phaseKey];
  const defaultOverride = STATE_PHASE_OVERRIDES["DEFAULT"]?.[phaseKey];
  const neutralDefault = NEUTRAL_PHASE_MILESTONES[phaseKey];

  return {
    milestone: stateOverride?.milestone
      || defaultOverride?.milestone
      || neutralDefault?.milestone,
    subtitle: stateOverride?.subtitle
      || defaultOverride?.subtitle
      || neutralDefault?.subtitle,
  };
}

/**
 * Hard guard: remove CA-only tasks for non-CA states.
 * Delegates to the canonical filterTasksForState() for all state-based filtering.
 */
function removeCAOnlyTasks(phases: PhaseTaskList[], state: string): PhaseTaskList[] {
  if (state === "CA") return phases;
  return phases.map(phase => ({
    ...phase,
    tasks: filterTasksForState(phase.tasks, state),
  }));
}

/**
 * Normalize phase-level metadata AND task content for the estate's state.
 * Phase milestones, subtitles, and task text are all adjusted.
 */
function normalizePhasesForState(phases: PhaseTaskList[], state: string): PhaseTaskList[] {
  return phases.map(phase => {
    // Use canonical resolvePhaseHeader: state → DEFAULT → NEUTRAL → original
    const resolved = resolvePhaseHeader(phase.phase, state);

    return {
      ...phase,
      milestone: resolved.milestone || phase.milestone,
      subtitle: resolved.subtitle || phase.subtitle,
      tasks: phase.tasks.map(task => normalizeTaskForState(task, state)).filter((t): t is PhaseTask => t !== null),
    };
  });
}

function isProbateMode(profile: EstateProfile) {
  return profile.activeEngines.includes("PROBATE") || profile.activeEngines.includes("AFFIDAVIT");
}

function ensurePreFilingCompliance(phases: PhaseTaskList[], profile: EstateProfile): PhaseTaskList[] {
  if (profile.state !== "NY" || !isProbateMode(profile)) return phases;

  const alreadyPresent = phases.some(p => p.phase === "pre_filing_compliance");
  if (alreadyPresent) return phases;

  const preFiling = SETTLEMENT_PHASE_TASKS.find(p => p.phase === "pre_filing_compliance");
  if (!preFiling) return phases;

  const immediateIndex = phases.findIndex(p => p.phase === "immediate_actions");
  const insertIndex = immediateIndex >= 0 ? immediateIndex + 1 : 0;
  const next = [...phases];
  next.splice(insertIndex, 0, JSON.parse(JSON.stringify(preFiling)));
  return next;
}

/**
 * Roadmap Response with Filtered Tasks
 */
export interface RoadmapResponse {
  estateId: string;
  phases: PhaseTaskList[];
  triggers: {
    hasMinors: boolean;
    isSmallEstate: boolean;
    isPrimaryResidence: boolean;
    isContested: boolean;
    showBondWaiver: boolean;
    showSpecialNotice: boolean;
    activeEngines: string[];
  };
  profile: EstateProfile;
}

/**
 * Analyze estate to determine which optional tasks should be shown
 */
export async function analyzeEstateProfile(estateId: string): Promise<EstateProfile> {
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

  // Calculate insolvency FIRST so it is passed INTO calculateAuthorityRecommendation.
  // Previously insolvency was calculated AFTER the engine call, which meant
  // type was never set to INSOLVENT_ESTATE and the roadmap was incorrect for
  // estates with more debts than assets.
  const totalAssets = estate.assets.reduce((sum, a: any) => sum + (Number(a.value) || 0), 0);
  const totalDebts = estate.liabilities.reduce((sum, l: any) => sum + (Number(l.amount) || 0), 0);
  const solvencyRatio = totalDebts > 0 ? (totalAssets / totalDebts) : 100;
  const hasInsolvencyRisk = solvencyRatio < 1.0;

  // Calculate recommendation using the multi-dimensional engine.
  // All 7 XLSX dimensions must be passed here:
  //   hasWill, isTrustRevocable, hasTODDeed, hasContest, isSpouse, isOutOfState, hasInsolvencyRisk
  const rec = calculateAuthorityRecommendation(estate.assets, estate.deceasedState, {
    hasWill: estate.hasWill,
    // isTrustRevocable: schema field (nullable Boolean). undefined = no trust / not known.
    isTrustRevocable: (estate as any).isTrustRevocable ?? undefined,
    isOutOfState: (estate as any).isOutOfState ?? false,
    // isSurvivingSpouse: used for spousal petition routing
    isSpouse: (estate as any).isSurvivingSpouse ?? false,
    hasMinors: estate.hasMinorBeneficiaries || estate.heirs.some(h => !h.isAdult),
    hasContest: estate.hasContest,
    hasTODDeed: (estate as any).hasTODDeed ?? estate.assets.some((a: any) => a.todDeedRecorded),
    // Pass pre-calculated insolvency risk so the engine sets type=INSOLVENT_ESTATE correctly
    hasInsolvencyRisk,
  });

  // Ensure INSOLVENT modifier is present and PROBATE engine active when insolvent
  if (hasInsolvencyRisk) {
    if (!rec.modifiers.includes("INSOLVENT")) rec.modifiers.push("INSOLVENT");
    if (!rec.activeEngines.includes("PROBATE")) rec.activeEngines.push("PROBATE");
  }

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
    hasUnknownHeirs: estate.hasUnknownHeirs
  };
}

/**
 * Filter tasks based on estate profile and exclusivity
 */
export function filterTasksForEstate(
  allTasks: PhaseTaskList[],
  profile: EstateProfile,
  completedTaskIds: string[] = []
): PhaseTaskList[] {
  // 1. Identify which exclusive groups have a completed task
  const completedGroups = new Set<string>();
  allTasks.forEach(phase => {
    phase.tasks.forEach(task => {
      if (task.exclusiveGroup && completedTaskIds.includes(task.id)) {
        completedGroups.add(task.exclusiveGroup);
      }
    });
  });

  return allTasks.map((phaseList) => ({
    ...phaseList,
    tasks: phaseList.tasks.filter((task) => {
      // 2. Handle Exclusivity: If a group is "set", only show the completed task in that group
      if (task.exclusiveGroup && completedGroups.has(task.exclusiveGroup)) {
        return completedTaskIds.includes(task.id);
      }

      // 3. Handle Track Compatibility (Multi-Dimensional)
      // We check if the task is compatible with ANY of the active engines.
      // E.g., if "PROBATE" is an active engine, show probate tasks.
      // If trackCompatibility is empty or null, show the task (no restrictions)
      if (task.trackCompatibility && task.trackCompatibility.length > 0) {
        const isCompatible = task.trackCompatibility.some(track =>
          profile.activeEngines.includes(track) ||
          (track === "AFFIDAVIT" && profile.procedureType === "SMALL_ESTATE_AFFIDAVIT")
        );
        if (!isCompatible) return false;
      }

      // 4. Handle Procedure Variants (e.g., TESTATE vs INTESTATE)
      if (task.applicability?.variants && task.applicability.variants.length > 0) {
        const hasMatchingVariant = task.applicability.variants.some(variant => {
          if (variant === "TESTATE") return profile.hasWill;
          if (variant === "INTESTATE") return !profile.hasWill;
          // Expand with more dynamic states here as needed (e.g. UPC_UNSUPERVISED)
          return false;
        });
        if (!hasMatchingVariant) return false;
      }

      // 5. Handle Predicates (AND/OR/NOT) and State Applicability
      if (task.applicability) {
        const { predicatesAll, predicatesAny, excludePredicates, states } = task.applicability;
        const profileMap = profile as any;

        if (states && states.length > 0) {
          if (!states.includes(profile.state)) return false;
        }


        if (predicatesAll && predicatesAll.length > 0) {
          const allTrue = predicatesAll.every(p => !!profileMap[p]);
          if (!allTrue) return false;
        }

        if (predicatesAny && predicatesAny.length > 0) {
          const anyTrue = predicatesAny.some(p => !!profileMap[p]);
          if (!anyTrue) return false;
        }

        if (excludePredicates && excludePredicates.length > 0) {
          const anyExcl = excludePredicates.some(p => !!profileMap[p]);
          if (anyExcl) return false;
        }
      }

      // Always show non-optional tasks (if they survived compatibility, variant, & predicate checks)
      if (!task.isOptional) return true;

      // Filter based on task ID and estate profile
      switch (task.id) {
        // Guardian Ad Litem Tasks (for minors)
        case "identify_minor_beneficiaries":
        case "petition_guardian_ad_litem":
        case "obtain_guardian_order":
        case "coordinate_with_guardian":
        case "guardian_distribution_approval":
          return profile.hasMinorBeneficiaries;

        // Primary Residence Succession (small estates in CA)
        case "check_primary_residence_succession":
        case "file_succession_petition":
        case "give_succession_notice":
        case "obtain_succession_order":
          return (
            profile.isSmallEstate &&
            profile.isPrimaryResidence &&
            profile.state === "CA"
          );

        // Contested Probate Tasks
        case "respond_to_objections":
        case "attend_contest_hearing":
        case "resolve_contest":
          return profile.isContested;

        // Bond Waiver (always show as optional - saves money)
        case "request_bond_waiver":
        case "file_bond_waiver":
        case "obtain_bond_waiver_order":
          return profile.authoritySource === "COURT"; // Only for court authority

        // Special Notice (always show - used in 90% of estates)
        case "track_special_notice_requests":
        case "serve_special_notice_parties":
          return profile.authoritySource === "COURT"; // Only for court authority

        // Will Search vs General Doc Search
        case "locate_will":
          return profile.hasWill;
        case "locate_docs_no_will":
          return !profile.hasWill;

        // Default: show other optional tasks
        default:
          return true;
      }
    }),
  }));
}

/**
 * Get roadmap from database based on estate's settlement type
 */
async function getRoadmapFromDatabase(
  estateId: string,
  profile: EstateProfile,
  completedTaskIds: string[]
): Promise<PhaseTaskList[]> {
  // Get estate to determine settlement type
  const estate = await db.estate.findUnique({
    where: { id: estateId },
    select: { estateType: true, settlementPath: true },
  });

  if (!estate) throw new Error(`Estate ${estateId} not found`);

  // Determine which settlement type to use
  // Priority: Derived Procedure (from assets) -> Explicit Path -> Default
  const settlementTypeCode = profile.procedureType !== "UNSET"
    ? profile.procedureType
    : (estate.settlementPath || estate.estateType || 'FORMAL_PROBATE');

  // Fetch roadmap from database
  const settlementType = await (db.settlementType as any).findUnique({
    where: { code: settlementTypeCode },
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
  const phases: PhaseTaskList[] = (settlementType as any).phases.map((phase: any) => ({
    phase: phase.phaseCode as any,
    title: phase.title,
    subtitle: phase.subtitle || '',
    milestone: phase.milestone || '',
    description: phase.description || '',
    isEscalationPath: phase.isEscalationPath,
    tasks: phase.tasks.map((task: any) => {
      // Find state override if it exists for this estate's state
      const stateOverride = overrideMap.get(task.taskCode);


      return {
        id: task.taskCode,
        title: stateOverride?.title || task.title,
        description: stateOverride?.description || task.description || task.title,
        estimatedTime: task.estimatedTime || undefined,
        category: task.category as any,
        isOptional: task.isOptional,
        requiresAuthority: task.requiresAuthority,
        requiredDocs: task.requiredDocs,
        dependencies: task.dependencies,
        exclusiveGroup: task.exclusiveGroup || undefined,
        trackCompatibility: task.trackCompatibility as any,
        tags: task.tags as any,
        alerts: (task.alerts as any[]) || undefined,
        links: (stateOverride?.links as any[]) || (task.links as any[]) || undefined,
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
  const caGuarded = removeCAOnlyTasks(filtered, profile.state);
  return normalizePhasesForState(caGuarded, profile.state);
}

/**
 * Get personalized roadmap for an estate
 */
export async function getEstateRoadmap(estateId: string): Promise<RoadmapResponse> {
  // Analyze estate profile
  const profile = await analyzeEstateProfile(estateId);

  // Get current progress
  const { completedTaskIds } = await getTaskCompletions(estateId);

  // Get roadmap from database (with fallback to hardcoded tasks)
  const filteredPhases = await getRoadmapFromDatabase(estateId, profile, completedTaskIds);

  // Development-time contamination check: warn if CA tokens leaked into non-CA state
  validateNoStateContamination(filteredPhases, profile.state);

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
  };
}

/**
 * Get task completion status for an estate
 */
export async function getTaskCompletions(estateId: string) {
  const estate = await db.estate.findUnique({
    where: { id: estateId },
    select: { roadmapProgress: true },
  });

  if (!estate) {
    throw new Error(`Estate ${estateId} not found`);
  }

  const progress = estate.roadmapProgress as any;
  return {
    completedTaskIds: progress?.completedTaskIds || [],
    completedPhases: progress?.completedPhases || [],
  };
}

/**
 * Mark a task as complete
 */
export async function completeTask(
  estateId: string,
  taskId: string,
  userId: string,
  notes?: string
) {
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
    const progress = (estate.roadmapProgress as any) || {
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
        } as any,
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
    } catch (spawnErr: any) {
      // Non-fatal — don't block task completion if follow-up spawn fails
      logger.warn(`[roadmapService] Follow-up spawn failed for task ${taskId} (non-fatal): ${spawnErr?.message}`);
    }
  }

  return { success: true, taskId, completedAt: completion.completedAt };
}

/**
 * Mark a task as incomplete
 */
export async function uncompleteTask(
  estateId: string,
  taskId: string,
  userId: string
) {
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
    const progress = (estate.roadmapProgress as any) || {
      completedTaskIds: [],
      completedPhases: [],
    };
    progress.completedTaskIds = progress.completedTaskIds.filter(
      (id: string) => id !== taskId
    );
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
