import { SETTLEMENT_PHASE_TASKS } from "../../src/config/settlementPhases.js";
import { prisma as db } from "../db.js";
import { calculateAuthorityRecommendation } from "../../src/lib/authorityEngine.js";
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
    // Calculate recommendation using the new multi-dimensional engine
    const rec = calculateAuthorityRecommendation(estate.assets, estate.deceasedState, {
        hasWill: estate.hasWill,
        isOutOfState: estate.isOutOfState ?? false,
        hasMinors: estate.hasMinorBeneficiaries || estate.heirs.some(h => !h.isAdult),
        hasContest: estate.hasContest,
        hasTODDeed: estate.hasTODDeed ?? estate.assets.some((a) => a.todDeedRecorded)
    });
    // Calculate Insolvency Risk
    const totalAssets = estate.assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
    const totalDebts = estate.liabilities.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const solvencyRatio = totalDebts > 0 ? (totalAssets / totalDebts) : 100;
    if (solvencyRatio < 1.0) {
        if (!rec.modifiers.includes("INSOLVENT")) {
            rec.modifiers.push("INSOLVENT");
        }
        // If insolvent, we might want to override procedure type or add active engines
        if (!rec.activeEngines.includes("PROBATE")) {
            rec.activeEngines.push("PROBATE"); // Insolvency usually requires court supervision
        }
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
        activeEngines: rec.activeEngines
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
                const isCompatible = task.trackCompatibility.some(track => profile.activeEngines.includes(track) ||
                    (track === "AFFIDAVIT" && profile.procedureType === "SMALL_ESTATE_AFFIDAVIT"));
                if (!isCompatible)
                    return false;
            }
            // Always show non-optional tasks
            if (!task.isOptional)
                return true;
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
                    return (profile.isSmallEstate &&
                        profile.isPrimaryResidence &&
                        profile.state === "CA");
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
async function getRoadmapFromDatabase(estateId, profile, completedTaskIds) {
    // Get estate to determine settlement type
    const estate = await db.estate.findUnique({
        where: { id: estateId },
        select: { estateType: true, settlementPath: true },
    });
    if (!estate)
        throw new Error(`Estate ${estateId} not found`);
    // Determine which settlement type to use
    // Priority: Derived Procedure (from assets) -> Explicit Path -> Default
    const settlementTypeCode = profile.procedureType !== "UNSET"
        ? profile.procedureType
        : (estate.settlementPath || estate.estateType || 'FORMAL_PROBATE');
    // Fetch roadmap from database
    const settlementType = await db.settlementType.findUnique({
        where: { code: settlementTypeCode },
        include: {
            phases: {
                orderBy: { orderIndex: 'asc' },
                include: {
                    tasks: {
                        orderBy: { orderIndex: 'asc' },
                    },
                },
            },
        },
    });
    if (!settlementType) {
        console.warn(`Settlement type ${settlementTypeCode} not found in database, falling back to hardcoded SETTLEMENT_PHASE_TASKS`);
        // Fallback to hardcoded tasks if type not found
        return filterTasksForEstate(SETTLEMENT_PHASE_TASKS, profile, completedTaskIds);
    }
    // Convert database format to PhaseTaskList format
    const phases = settlementType.phases.map(phase => ({
        phase: phase.phaseCode,
        title: phase.title,
        subtitle: phase.subtitle || '',
        milestone: phase.milestone || '',
        description: phase.description || '',
        isEscalationPath: phase.isEscalationPath,
        tasks: phase.tasks.map(task => ({
            id: task.taskCode,
            title: task.title,
            description: task.description || task.title,
            estimatedTime: task.estimatedTime,
            category: task.category,
            isOptional: task.isOptional,
            requiresAuthority: task.requiresAuthority,
            requiredDocs: task.requiredDocs,
            dependencies: task.dependencies,
            exclusiveGroup: task.exclusiveGroup || undefined,
            trackCompatibility: task.trackCompatibility,
            tags: task.tags,
            alerts: undefined,
            utility: undefined,
            isLongHorizon: undefined,
            links: undefined,
            deadlineWarningId: undefined,
            helpArticleId: undefined,
            applicability: undefined,
            isInternationalOnly: undefined,
            isAttorneyReviewNode: undefined,
            attorneyReviewReason: undefined,
            isConditional: undefined,
            conditionalRequirementLabel: undefined,
            requiresNotary: undefined,
            requiresPhysicalMail: undefined,
        })),
    }));
    // Apply existing filtering logic
    return filterTasksForEstate(phases, profile, completedTaskIds);
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
