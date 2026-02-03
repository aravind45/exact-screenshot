import { SETTLEMENT_PHASE_TASKS, PhaseTaskList, PhaseTask } from "../../src/config/settlementPhases.js";
import { prisma as db } from "../db.js";
/**
 * Estate Profile for Task Filtering
 */
interface EstateProfile {
  id: string;
  hasMinorBeneficiaries: boolean;
  isSmallEstate: boolean;
  isPrimaryResidence: boolean;
  isContested: boolean;
  state: string;
  estimatedValue: number;
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
    },
  });

  if (!estate) {
    throw new Error(`Estate ${estateId} not found`);
  }

  // Detect characteristics (persist flags if not set)
  const hasMinorBeneficiaries = estate.hasMinorBeneficiaries || estate.heirs.some((heir) => !heir.isAdult);
  const isContested = estate.hasContest || estate.probateNotes?.toLowerCase().includes("contest") || false;

  const estimatedValue =
    Number(estate.estimatedPersonalProperty || 0) +
    Number(estate.estimatedRealProperty || 0);
  const isSmallEstate = estimatedValue < 100000;

  const isPrimaryResidence = estate.hasPrimaryResidence || estate.assets.some(
    (asset) =>
      asset.assetType === "real_estate" &&
      asset.inventoryCategory === "ATTACHMENT_1" // Real property
  );

  return {
    id: estate.id,
    hasMinorBeneficiaries,
    isSmallEstate,
    isPrimaryResidence,
    isContested,
    state: estate.deceasedState,
    estimatedValue,
  };
}

/**
 * Filter tasks based on estate profile
 */
export function filterTasksForEstate(
  allTasks: PhaseTaskList[],
  profile: EstateProfile
): PhaseTaskList[] {
  return allTasks.map((phaseList) => ({
    ...phaseList,
    tasks: phaseList.tasks.filter((task) => {
      // Always show non-optional tasks
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
          return true;

        // Special Notice (always show - used in 90% of estates)
        case "track_special_notice_requests":
        case "serve_special_notice_parties":
          return true;

        // Default: show other optional tasks
        default:
          return task.isOptional;
      }
    }),
  }));
}

/**
 * Get personalized roadmap for an estate
 */
export async function getEstateRoadmap(estateId: string): Promise<RoadmapResponse> {
  // Analyze estate profile
  const profile = await analyzeEstateProfile(estateId);

  // Filter tasks based on profile
  const filteredPhases = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, profile);

  // Return roadmap with triggers
  return {
    estateId,
    phases: filteredPhases,
    triggers: {
      hasMinors: profile.hasMinorBeneficiaries,
      isSmallEstate: profile.isSmallEstate,
      isPrimaryResidence: profile.isPrimaryResidence,
      isContested: profile.isContested,
      showBondWaiver: true, // Always show as optional
      showSpecialNotice: true, // Always show
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
