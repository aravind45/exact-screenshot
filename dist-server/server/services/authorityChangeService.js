/**
 * Authority Change Service
 *
 * Implements the AuthorityType Change Policy with:
 * - Pinning stability
 * - Explicit repin workflows
 * - Comprehensive audit logging
 *
 * ROOT CAUSE FIX: Prevents trust/probate module leakage by tracking authority
 * type changes and requiring explicit repin confirmation when authority changes.
 */
import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";
import { calculateAuthorityRecommendation } from "../../src/lib/authorityEngine.js";
import { deriveEstateAuthorityType } from "../../src/types/authorityScope.js";
import { filterPhasesByAuthorityScope, filterPhasesByJurisdiction } from "../../src/shared/filterByJurisdiction.js";
import { SETTLEMENT_PHASE_TASKS } from "../../src/config/settlementPhases.js";
/**
 * Compute authority recommendation without mutating estate
 * This is a read-only operation that returns what the authority would be
 */
export async function computeAuthorityRecommendation(estateId) {
    const estate = await prisma.estate.findUnique({
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
    // Calculate current recommendation from engine
    const totalAssets = estate.assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
    const totalDebts = estate.liabilities.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const solvencyRatio = totalDebts > 0 ? (totalAssets / totalDebts) : 100;
    const hasInsolvencyRisk = solvencyRatio < 1.0;
    const estimatedPersonal = Number(estate.estimatedPersonalProperty) || 0;
    const estimatedReal = Number(estate.estimatedRealProperty) || 0;
    const registrationEstimate = estimatedPersonal + estimatedReal;
    const rec = calculateAuthorityRecommendation(estate.assets, estate.deceasedState, {
        hasWill: estate.hasWill,
        isTrustRevocable: estate.isTrustRevocable ?? undefined,
        isOutOfState: estate.isOutOfState ?? false,
        isSpouse: estate.isSurvivingSpouse ?? false,
        hasMinors: estate.hasMinorBeneficiaries || estate.heirs.some(h => !h.isAdult),
        hasContest: estate.hasContest,
        hasTODDeed: estate.hasTODDeed ?? estate.assets.some((a) => a.todDeedRecorded),
        hasInsolvencyRisk,
        estimatedValue: registrationEstimate > 0 ? registrationEstimate : undefined
    });
    if (hasInsolvencyRisk) {
        if (!rec.modifiers.includes("INSOLVENT"))
            rec.modifiers.push("INSOLVENT");
        if (!rec.activeEngines.includes("PROBATE"))
            rec.activeEngines.push("PROBATE");
    }
    const recommendedEstateAuthorityType = deriveEstateAuthorityType(rec.activeEngines);
    const currentEstateAuthorityType = estate.estateAuthorityType || deriveEstateAuthorityType(rec.activeEngines);
    // Determine if authority has changed
    const currentAuthorityType = estate.authorityType || "UNSET";
    const recommendedAuthorityType = rec.type;
    const hasAuthorityChanged = currentAuthorityType !== recommendedAuthorityType && currentAuthorityType !== "UNSET";
    const hasEstateAuthorityChanged = currentEstateAuthorityType !== recommendedEstateAuthorityType;
    // Check if pinned and if change is pending
    const isPinned = !!estate.authorityPinnedAt;
    const authorityChangePending = isPinned && (hasAuthorityChanged || hasEstateAuthorityChanged);
    return {
        currentAuthorityType,
        recommendedAuthorityType,
        estateAuthorityType: currentEstateAuthorityType,
        recommendedEstateAuthorityType,
        changeReason: rec.reason,
        changeSource: "ENGINE",
        requiresRepin: isPinned && authorityChangePending,
        authorityChangePending,
    };
}
/**
 * Generate a preview of what would change if we repinned
 */
export async function getRepinPreview(estateId) {
    const estate = await prisma.estate.findUnique({
        where: { id: estateId },
        include: {
            heirs: true,
            assets: true,
            liabilities: true,
            taskCompletions: {
                where: { completed: true }
            }
        },
    });
    if (!estate) {
        throw new Error(`Estate ${estateId} not found`);
    }
    if (!estate.deceasedState) {
        throw new Error("STATE_REQUIRED");
    }
    // Get current and recommended authority
    const recommendation = await computeAuthorityRecommendation(estateId);
    // Get current task IDs
    const completedTaskIds = estate.taskCompletions.map(tc => tc.taskId);
    // Build current task set (using pinned authority)
    const currentEstateAuthorityType = estate.estateAuthorityType || "BOTH";
    const currentTasks = await getTasksForAuthorityType(estate.deceasedState, currentEstateAuthorityType);
    const currentTaskIds = new Set(currentTasks.map(t => t.id));
    // Build recommended task set
    const recommendedTasks = await getTasksForAuthorityType(estate.deceasedState, recommendation.recommendedEstateAuthorityType);
    const recommendedTaskIds = new Set(recommendedTasks.map(t => t.id));
    // Calculate diff
    const tasksAdded = [];
    const tasksRemoved = [];
    const addedWithTitles = [];
    const removedWithTitles = [];
    for (const task of recommendedTasks) {
        if (!currentTaskIds.has(task.id)) {
            tasksAdded.push(task.id);
            addedWithTitles.push({ id: task.id, title: task.title });
        }
    }
    for (const task of currentTasks) {
        if (!recommendedTaskIds.has(task.id)) {
            tasksRemoved.push(task.id);
            removedWithTitles.push({ id: task.id, title: task.title });
        }
    }
    // Check impact on completed tasks
    const completedTasksAffected = completedTaskIds.filter(id => tasksRemoved.includes(id));
    const canMigrate = completedTasksAffected.length === 0;
    return {
        currentAuthorityType: recommendation.currentAuthorityType,
        recommendedAuthorityType: recommendation.recommendedAuthorityType,
        estateAuthorityType: recommendation.estateAuthorityType,
        recommendedEstateAuthorityType: recommendation.recommendedEstateAuthorityType,
        changeReason: recommendation.changeReason,
        tasksAdded,
        tasksRemoved,
        completionImpact: {
            affectedTasks: tasksAdded.length + tasksRemoved.length,
            completedTasksAffected: completedTasksAffected.length,
            canMigrate,
        },
        requiresConfirmation: completedTasksAffected.length > 0 || tasksRemoved.length > 0,
        diffSummary: {
            added: addedWithTitles,
            removed: removedWithTitles,
        },
    };
}
/**
 * Get tasks filtered by authority type
 */
async function getTasksForAuthorityType(stateCode, estateAuthorityType) {
    const allTasks = SETTLEMENT_PHASE_TASKS.flatMap(phase => phase.tasks);
    // Apply jurisdiction filter
    const { phases: jurisdictionFiltered } = filterPhasesByJurisdiction(SETTLEMENT_PHASE_TASKS.map(p => ({ phase: p.phase, tasks: p.tasks })), stateCode);
    // Apply authority scope filter
    const { phases: authorityFiltered } = filterPhasesByAuthorityScope(jurisdictionFiltered, estateAuthorityType);
    return authorityFiltered.flatMap(p => p.tasks);
}
/**
 * Log authority change event for audit trail
 */
export async function logAuthorityChangeEvent(params) {
    const event = await prisma.authorityChangeEvent.create({
        data: {
            estateId: params.estateId,
            previousType: params.previousType,
            newType: params.newType,
            changeSource: params.changeSource,
            triggeredBy: params.triggeredBy,
            computedAt: new Date(),
            appliedAt: new Date(),
            diffSummary: params.diffSummary || null,
            migrationNotes: params.migrationNotes,
        },
    });
    logger.info({
        estateId: params.estateId,
        eventId: event.id,
        previousType: params.previousType,
        newType: params.newType,
        changeSource: params.changeSource,
    }, "Authority change event logged");
    return event.id;
}
/**
 * Update estate authority type with audit logging
 */
export async function updateEstateAuthorityType(params) {
    const estate = await prisma.estate.findUnique({
        where: { id: params.estateId },
        select: { authorityType: true, estateAuthorityType: true },
    });
    if (!estate) {
        throw new Error(`Estate ${params.estateId} not found`);
    }
    const previousType = estate.authorityType;
    const previousEstateType = estate.estateAuthorityType;
    // Check if there's an actual change
    const hasChange = previousType !== params.newAuthorityType ||
        previousEstateType !== params.newEstateAuthorityType;
    if (!hasChange) {
        logger.debug({ estateId: params.estateId }, "No authority type change detected, skipping update");
        return;
    }
    // Log the change event
    await logAuthorityChangeEvent({
        estateId: params.estateId,
        previousType,
        newType: params.newAuthorityType,
        changeSource: params.changeSource,
        triggeredBy: params.triggeredBy,
    });
    // Update the estate
    await prisma.estate.update({
        where: { id: params.estateId },
        data: {
            authorityType: params.newAuthorityType,
            estateAuthorityType: params.newEstateAuthorityType,
            authorityTypeSource: params.changeSource,
            authorityPinnedAt: params.pinAfterUpdate ? new Date() : undefined,
            authorityChangePending: false,
            recommendedAuthorityType: null,
            recommendedAuthorityReason: null,
        },
    });
    logger.info({
        estateId: params.estateId,
        previousType,
        newType: params.newAuthorityType,
        previousEstateType,
        newEstateAuthorityType: params.newEstateAuthorityType,
        changeSource: params.changeSource,
    }, "Estate authority type updated");
}
/**
 * Pin authority type for an estate
 * This freezes the authority type and marks it as pinned
 */
export async function pinAuthorityType(estateId, userId) {
    const recommendation = await computeAuthorityRecommendation(estateId);
    await updateEstateAuthorityType({
        estateId,
        newAuthorityType: recommendation.recommendedAuthorityType,
        newEstateAuthorityType: recommendation.recommendedEstateAuthorityType,
        changeSource: "INITIAL_PIN",
        triggeredBy: userId,
        pinAfterUpdate: true,
    });
    const estate = await prisma.estate.findUnique({
        where: { id: estateId },
        select: { authorityType: true, estateAuthorityType: true, authorityPinnedAt: true },
    });
    return {
        success: true,
        authorityType: estate?.authorityType || recommendation.recommendedAuthorityType,
        estateAuthorityType: estate?.estateAuthorityType || recommendation.recommendedEstateAuthorityType,
        pinnedAt: estate?.authorityPinnedAt || new Date(),
    };
}
/**
 * Repin authority type with confirmation workflow
 * Requires explicit confirmation if completed tasks would be affected
 */
export async function repinAuthorityType(estateId, userId, confirm = false) {
    const preview = await getRepinPreview(estateId);
    // Check if confirmation is required
    if (preview.requiresConfirmation && !confirm) {
        return {
            success: false,
            requiresConfirmation: true,
            preview,
        };
    }
    // Check if there's an actual change
    if (preview.currentAuthorityType === preview.recommendedAuthorityType &&
        preview.estateAuthorityType === preview.recommendedEstateAuthorityType) {
        return { success: true };
    }
    // Log the change event with diff summary
    await logAuthorityChangeEvent({
        estateId,
        previousType: preview.currentAuthorityType,
        newType: preview.recommendedAuthorityType,
        changeSource: "REPIN",
        triggeredBy: userId,
        diffSummary: {
            tasksAdded: preview.tasksAdded,
            tasksRemoved: preview.tasksRemoved,
            affectedTasks: preview.completionImpact.affectedTasks,
        },
        migrationNotes: preview.completionImpact.completedTasksAffected > 0
            ? `Warning: ${preview.completionImpact.completedTasksAffected} completed tasks affected`
            : undefined,
    });
    // Update the estate
    await prisma.estate.update({
        where: { id: estateId },
        data: {
            authorityType: preview.recommendedAuthorityType,
            estateAuthorityType: preview.recommendedEstateAuthorityType,
            authorityTypeSource: "REPIN",
            authorityPinnedAt: new Date(),
            authorityChangePending: false,
            recommendedAuthorityType: null,
            recommendedAuthorityReason: null,
        },
    });
    logger.info({
        estateId,
        userId,
        previousType: preview.currentAuthorityType,
        newType: preview.recommendedAuthorityType,
        tasksAdded: preview.tasksAdded.length,
        tasksRemoved: preview.tasksRemoved.length,
    }, "Authority type repinned");
    return { success: true };
}
/**
 * Check and update authority change pending status
 * Called when estate profile changes to detect if authority recommendation has drifted
 */
export async function checkAuthorityChangePending(estateId) {
    const estate = await prisma.estate.findUnique({
        where: { id: estateId },
        select: {
            authorityType: true,
            estateAuthorityType: true,
            authorityPinnedAt: true,
        },
    });
    if (!estate || !estate.authorityPinnedAt) {
        return false;
    }
    const recommendation = await computeAuthorityRecommendation(estateId);
    const hasChange = estate.authorityType !== recommendation.recommendedAuthorityType ||
        estate.estateAuthorityType !== recommendation.recommendedEstateAuthorityType;
    if (hasChange) {
        // Update pending status and store recommendation
        await prisma.estate.update({
            where: { id: estateId },
            data: {
                authorityChangePending: true,
                recommendedAuthorityType: recommendation.recommendedAuthorityType,
                recommendedAuthorityReason: {
                    reason: recommendation.changeReason,
                    estateAuthorityType: recommendation.recommendedEstateAuthorityType,
                },
            },
        });
    }
    return hasChange;
}
/**
 * Get authority change history for an estate
 */
export async function getAuthorityChangeHistory(estateId) {
    const events = await prisma.authorityChangeEvent.findMany({
        where: { estateId },
        orderBy: { computedAt: 'desc' },
        take: 50,
    });
    return events;
}
/**
 * Revert last authority change (if not already applied downstream)
 */
export async function revertAuthorityChange(estateId, userId, reason) {
    const lastEvent = await prisma.authorityChangeEvent.findFirst({
        where: {
            estateId,
            revertedAt: null,
        },
        orderBy: { computedAt: 'desc' },
    });
    if (!lastEvent || !lastEvent.previousType) {
        throw new Error("No reversible authority change found");
    }
    // Revert the estate
    await prisma.estate.update({
        where: { id: estateId },
        data: {
            authorityType: lastEvent.previousType,
        },
    });
    // Mark event as reverted
    await prisma.authorityChangeEvent.update({
        where: { id: lastEvent.id },
        data: {
            revertedAt: new Date(),
            revertReason: reason,
        },
    });
    logger.info({
        estateId,
        userId,
        eventId: lastEvent.id,
        revertedTo: lastEvent.previousType,
        reason,
    }, "Authority change reverted");
    return { success: true };
}
