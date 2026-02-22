import { SETTLEMENT_PHASE_TASKS, PhaseTaskList, PhaseTask } from "../../src/config/settlementPhases.js";
import { prisma as db } from "../db.js";
import { calculateAuthorityRecommendation } from "../../src/lib/authorityEngine.js";
import { AuthoritySource, ProcedureType, DistributionModel } from "../../src/lib/stateRules.js";
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
  send_notice_of_proposed_action: { institutionName: "Heirs / Beneficiaries", subject: "Notice of Proposed Action sent — objection window open", responseWindowDays: 15 },
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

      // 5. Handle Predicates (AND/OR/NOT)
      if (task.applicability) {
        const { predicatesAll, predicatesAny, excludePredicates } = task.applicability;
        const profileMap = profile as any;

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
    return filterTasksForEstate(SETTLEMENT_PHASE_TASKS, profile, completedTaskIds);
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
          (task.predicatesAll && task.predicatesAll.length > 0) ||
          (task.predicatesAny && task.predicatesAny.length > 0) ||
          (task.excludePredicates && task.excludePredicates.length > 0)
          ? {
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

  // Apply existing filtering logic
  return filterTasksForEstate(phases, profile, completedTaskIds);
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
