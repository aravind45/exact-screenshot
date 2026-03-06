import { prisma } from "../db.js";
import { EstateStatus, OnboardingStatus } from "@prisma/client";
import { logger } from "../lib/logger.js";
/**
 * Onboarding step enum (not in Prisma schema, stored as string)
 */
export var OnboardingStep;
(function (OnboardingStep) {
    OnboardingStep["WELCOME"] = "welcome";
    OnboardingStep["ESTATE_INFO"] = "estate_info";
    OnboardingStep["GUIDED_ASSESSMENT"] = "guided_assessment";
    OnboardingStep["TRACK_SCOUT"] = "track_scout";
    OnboardingStep["HEIRS"] = "heirs";
    OnboardingStep["DOCUMENTS"] = "documents";
    OnboardingStep["ASSETS"] = "assets";
    OnboardingStep["TEAM"] = "team";
    OnboardingStep["COMPLETION"] = "completion";
})(OnboardingStep || (OnboardingStep = {}));
/**
 * Step ranks to enforce monotonicity and prevent skips.
 * This is the CANONICAL ordering – all step comparisons MUST use this array.
 */
export const STEP_ORDER = [
    OnboardingStep.WELCOME,
    OnboardingStep.ESTATE_INFO,
    OnboardingStep.GUIDED_ASSESSMENT,
    OnboardingStep.TRACK_SCOUT,
    OnboardingStep.HEIRS,
    OnboardingStep.DOCUMENTS,
    OnboardingStep.ASSETS,
    OnboardingStep.TEAM,
    OnboardingStep.COMPLETION
];
/**
 * Map from step enum to the canonical URL route fragment.
 */
const STEP_ROUTE_MAP = {
    [OnboardingStep.WELCOME]: "/onboarding?step=welcome",
    [OnboardingStep.ESTATE_INFO]: "/onboarding?step=estate_info",
    [OnboardingStep.GUIDED_ASSESSMENT]: "/onboarding?step=guided_assessment",
    [OnboardingStep.TRACK_SCOUT]: "/onboarding?step=track_scout",
    [OnboardingStep.HEIRS]: "/onboarding?step=heirs",
    [OnboardingStep.DOCUMENTS]: "/onboarding?step=documents",
    [OnboardingStep.ASSETS]: "/onboarding?step=assets",
    [OnboardingStep.TEAM]: "/onboarding?step=team",
    [OnboardingStep.COMPLETION]: "/onboarding?step=completion",
};
/**
 * Maps frontend step IDs to backend OnboardingStep enum values
 * Frontend has more granular steps than the backend enum
 */
function mapFrontendStepToEnum(frontendStep) {
    const stepMapping = {
        'welcome': OnboardingStep.WELCOME,
        'estate_info': OnboardingStep.ESTATE_INFO,
        'assessment_basics': OnboardingStep.GUIDED_ASSESSMENT,
        'assessment_details': OnboardingStep.GUIDED_ASSESSMENT,
        'roadmap_preview': OnboardingStep.TRACK_SCOUT,
        'heirs': OnboardingStep.HEIRS,
        'documents': OnboardingStep.DOCUMENTS,
        'assets': OnboardingStep.ASSETS,
        'team': OnboardingStep.TEAM,
        'completion': OnboardingStep.COMPLETION
    };
    return stepMapping[frontendStep] || frontendStep;
}
/**
 * Returns the rank (0-based index) of a step in the canonical order.
 * Returns -1 if step is null/undefined or not found.
 */
export function stepRank(step) {
    if (!step)
        return -1;
    return STEP_ORDER.indexOf(step);
}
export class OnboardingService {
    /**
     * Computes the current canonical onboarding state for an estate.
     * This is the SINGLE SOURCE OF TRUTH for:
     *   - "Where is the user in onboarding?"
     *   - "What route should they be on?"
     *   - "What data do we have / is missing?"
     *
     * ALL routing decisions MUST flow through this function.
     * Frontend heuristics are FORBIDDEN.
     */
    static async computeOnboardingState(estateId, policy = "EXPLICIT_ID") {
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: {
                assets: true,
                heirs: true,
            }
        });
        if (!estate) {
            throw new Error(`Estate not found: ${estateId}`);
        }
        const completedSteps = [];
        const missingFields = [];
        const invariantViolations = [];
        let currentStep = null; // Initialize as OnboardingStep | null
        // ────── Step Completion Checks ─────────────────────────────────────────────────────────
        // WELCOME is always "completed" once the estate exists
        completedSteps.push(OnboardingStep.WELCOME);
        // Check: ESTATE_INFO (Deceased Basics)
        const hasEstateInfo = !!(estate.deceasedFirstName && estate.deceasedLastName && estate.deceasedState);
        if (hasEstateInfo) {
            completedSteps.push(OnboardingStep.ESTATE_INFO);
        }
        else {
            if (!estate.deceasedFirstName)
                missingFields.push("deceasedFirstName");
            if (!estate.deceasedLastName)
                missingFields.push("deceasedLastName");
            if (!estate.deceasedState)
                missingFields.push("deceasedState");
        }
        // Check: GUIDED_ASSESSMENT (Assessment Questions)
        const hasAssessment = estate.isSurvivingSpouse !== null && estate.hasWill !== null;
        if (hasAssessment) {
            completedSteps.push(OnboardingStep.GUIDED_ASSESSMENT);
        }
        // Check: TRACK_SCOUT (Authority Selection)
        const hasTrack = !!(estate.userSelectedEstateAuthorityType || estate.estateAuthorityType);
        if (hasTrack) {
            completedSteps.push(OnboardingStep.TRACK_SCOUT);
        }
        else {
            missingFields.push("userSelectedEstateAuthorityType");
        }
        // Check: HEIRS (At least one heir added OR checkpoint is past HEIRS)
        const hasHeirs = estate.heirs && estate.heirs.length > 0;
        const checkpointPastHeirs = stepRank(estate.onboardingStep) >= stepRank(OnboardingStep.DOCUMENTS);
        if (hasHeirs || checkpointPastHeirs) {
            completedSteps.push(OnboardingStep.HEIRS);
        }
        // Check: DOCUMENTS (Checkpoint past DOCUMENTS)
        const checkpointPastDocs = stepRank(estate.onboardingStep) >= stepRank(OnboardingStep.ASSETS);
        if (checkpointPastDocs) {
            completedSteps.push(OnboardingStep.DOCUMENTS);
        }
        // Check: ASSETS (At least one asset added OR checkpoint is past ASSETS)
        const hasAssets = estate.assets && estate.assets.length > 0;
        const checkpointPastAssets = stepRank(estate.onboardingStep) >= stepRank(OnboardingStep.TEAM);
        if (hasAssets || checkpointPastAssets) {
            completedSteps.push(OnboardingStep.ASSETS);
        }
        // Check: TEAM (Checkpoint past TEAM)
        const checkpointPastTeam = stepRank(estate.onboardingStep) >= stepRank(OnboardingStep.COMPLETION);
        if (checkpointPastTeam) {
            completedSteps.push(OnboardingStep.TEAM);
        }
        // ────── Completion Invariant ─────────────────────────────────────────────────────────
        // isComplete === (estateStatus === ACTIVE && onboardingStatus === ROADMAP_GENERATED && onboardingCompletedAt != null)
        const isComplete = estate.estateStatus === EstateStatus.ACTIVE &&
            estate.onboardingStatus === OnboardingStatus.ROADMAP_GENERATED &&
            estate.onboardingCompletedAt != null;
        if (isComplete) {
            completedSteps.push(OnboardingStep.COMPLETION);
        }
        // ────── Invariant Violation Detection ─────────────────────────────────────────
        if (estate.estateStatus === EstateStatus.ACTIVE && !isComplete) {
            invariantViolations.push(`INVARIANT_VIOLATION_ACTIVE_BUT_ONBOARDING_INCOMPLETE: status=${estate.onboardingStatus}, completedAt=${estate.onboardingCompletedAt}`);
        }
        if (isComplete && missingFields.length > 0) {
            invariantViolations.push(`INVARIANT_VIOLATION_COMPLETE_BUT_FIELDS_MISSING: ${missingFields.join(", ")}`);
        }
        // ────── Determine Current Step (First Incomplete) ─────────────────────────────────────────
        if (!isComplete) {
            // Walk the step order and find the first step NOT in completedSteps
            // For core gates (ESTATE_INFO, GUIDED_ASSESSMENT, TRACK_SCOUT) we use data checks.
            // For optional steps (HEIRS, DOCUMENTS, ASSETS, TEAM) we use the checkpoint.
            if (!hasEstateInfo) {
                currentStep = OnboardingStep.ESTATE_INFO;
            }
            else if (!hasAssessment) {
                currentStep = OnboardingStep.GUIDED_ASSESSMENT;
            }
            else if (!hasTrack) {
                currentStep = OnboardingStep.TRACK_SCOUT;
            }
            else {
                // Core gates passed. Use the DB checkpoint for optional steps.
                const checkpoint = estate.onboardingStep;
                const checkpointIdx = stepRank(checkpoint);
                // If checkpoint is at or past COMPLETION, but isComplete is false,
                // that means the completion transition didn't fire – force COMPLETION step.
                if (checkpointIdx >= stepRank(OnboardingStep.COMPLETION)) {
                    currentStep = OnboardingStep.COMPLETION;
                }
                else if (checkpointIdx >= stepRank(OnboardingStep.HEIRS)) {
                    // Use checkpoint directly – it IS the current step
                    currentStep = checkpoint;
                }
                else {
                    // Checkpoint is behind optional steps; advance to HEIRS
                    currentStep = OnboardingStep.HEIRS;
                }
            }
            // Ensure all steps BEFORE currentStep are in completedSteps
            const currentRank = stepRank(currentStep);
            for (let i = 0; i < currentRank; i++) {
                if (!completedSteps.includes(STEP_ORDER[i])) {
                    completedSteps.push(STEP_ORDER[i]);
                }
            }
        }
        // ────── Canonical Route ─────────────────────────────────────────────────────────
        const nextRoute = isComplete
            ? "/dashboard"
            : (currentStep ? STEP_ROUTE_MAP[currentStep] : "/onboarding?step=estate_info");
        return {
            activeEstateId: estateId,
            isComplete,
            currentStep,
            nextRoute,
            completedSteps,
            missingFields,
            onboardingVersion: estate.onboardingVersion || 1,
            status: estate.onboardingStatus || null,
            prefillData: {
                // Core Basics
                deceasedFirstName: estate.deceasedFirstName,
                deceasedLastName: estate.deceasedLastName,
                deceasedState: estate.deceasedState,
                deceasedDateOfDeath: estate.deceasedDateOfDeath,
                hasWill: estate.hasWill,
                isSurvivingSpouse: estate.isSurvivingSpouse,
                userSelectedEstateAuthorityType: estate.userSelectedEstateAuthorityType,
                // Meta
                onboardingStep: estate.onboardingStep,
                onboardingStatus: estate.onboardingStatus,
                // Assessment fields
                estimatedPersonalProperty: estate.estimatedPersonalProperty,
                estimatedLiabilities: estate.estimatedLiabilities,
                hasTODDeed: estate.hasTODDeed,
                hasOutOfStateProperty: estate.hasOutOfStateProperty,
                hasUnknownHeirs: estate.hasUnknownHeirs,
                isTrustRevocable: estate.isTrustRevocable,
                hasContest: estate.hasContest,
            },
            decisionTrace: {
                usedEstateSelectionPolicy: policy,
                invariantViolations: invariantViolations.length > 0 ? invariantViolations : undefined,
                computedAt: new Date().toISOString()
            }
        };
    }
    /**
     * Resolves the active estate ID for a user using the deterministic policy chain:
     *   1. User.activeEstateId (explicit pointer)
     *   2. Latest DRAFT estate (fallback)
     *   3. null (no estate)
     *
     * Returns { estateId, policy }.
     */
    static async resolveActiveEstate(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { activeEstateId: true }
        });
        if (user?.activeEstateId) {
            return { estateId: user.activeEstateId, policy: "USER_ACTIVE_POINTER" };
        }
        const latestDraft = await prisma.estate.findFirst({
            where: { userId, estateStatus: "DRAFT" },
            orderBy: { createdAt: "desc" },
            select: { id: true }
        });
        return {
            estateId: latestDraft?.id || null,
            policy: "LATEST_DRAFT_FALLBACK"
        };
    }
    /**
     * Creates a skeleton estate for a user who has no estate yet.
     * Sets the user's activeEstateId pointer.
     * Returns the new estate ID.
     */
    static async initializeEstate(userId) {
        const newEstate = await prisma.estate.create({
            data: {
                userId,
                name: "Initial Estate",
                estateStatus: EstateStatus.DRAFT,
                onboardingVersion: 1,
                onboardingStep: OnboardingStep.WELCOME,
                onboardingStatus: OnboardingStatus.ASSESSMENT_INCOMPLETE,
            },
            select: { id: true }
        });
        await prisma.user.update({
            where: { id: userId },
            data: { activeEstateId: newEstate.id }
        });
        logger.info({ userId, estateId: newEstate.id }, "[Onboarding] Initialized skeleton estate");
        return newEstate.id;
    }
    /**
     * Validates whether accessing a specific step is allowed given the current state.
     * Returns { allowed: true } or { allowed: false, canonicalStep, canonicalRoute }.
     *
     * Used for future-checkpoint safety (409 Conflict on skip attempts).
     */
    static async validateStepAccess(estateId, requestedStep) {
        const state = await OnboardingService.computeOnboardingState(estateId);
        if (state.isComplete) {
            return { allowed: true };
        }
        const requestedRank = stepRank(requestedStep);
        const canonicalRank = stepRank(state.currentStep);
        // Allow access to current step or any completed step
        if (requestedRank <= canonicalRank) {
            return { allowed: true };
        }
        // Attempting to skip ahead ΓÇô blocked
        return {
            allowed: false,
            canonicalStep: state.currentStep,
            canonicalRoute: state.nextRoute,
        };
    }
    static async updateProgress(estateId, data, userId) {
        return await prisma.$transaction(async (tx) => {
            // Lock-read the current state inside the transaction
            const currentEstate = await tx.estate.findUnique({
                where: { id: estateId },
                select: {
                    onboardingStep: true,
                    estateStatus: true,
                    onboardingStatus: true,
                    deceasedState: true,
                    userSelectedEstateAuthorityType: true,
                    estateAuthorityType: true,
                }
            });
            if (!currentEstate)
                throw new Error("Estate not found");
            const { step, onboardingVersion, ...fields } = data;
            // ────── 1. Monotonicity & Skip Prevention ─────────────────────────────────────────
            const currentRank = stepRank(currentEstate.onboardingStep);
            const targetStepEnum = step ? mapFrontendStepToEnum(step) : null;
            const targetRank = stepRank(targetStepEnum);
            if (targetRank !== -1) {
                // MONOTONIC: Reject regression
                if (targetRank < currentRank) {
                    logger.warn({
                        estateId, userId,
                        from: currentEstate.onboardingStep,
                        to: step,
                    }, "[Onboarding] Ignored progress regression (monotonic enforcement)");
                    // Silently ignore – idempotent behavior for repeated calls
                }
                // SKIP PREVENTION: Cannot jump more than 1 step ahead (unless already ACTIVE/COMPLETED)
                if (targetRank > currentRank + 1 && currentEstate.estateStatus !== EstateStatus.ACTIVE) {
                    const error = new Error("ONBOARDING_SKIP_ATTEMPTED");
                    error.statusCode = 409;
                    error.requiredStep = STEP_ORDER[currentRank + 1] || STEP_ORDER[currentRank];
                    throw error;
                }
            }
            // ────── 2. Build Update Payload (Idempotent Field Mapping) ─────────────────────────
            const updateData = {};
            // Only advance step if target > current (monotonic)
            if (targetRank > currentRank) {
                updateData.onboardingStep = targetStepEnum; // Store the Enum in DB
            }
            // Map fields with type coercion, skipping unchanged values
            for (const [key, value] of Object.entries(fields)) {
                if (!OnboardingService.ALLOWED_FIELDS.has(key)) {
                    continue; // Skip unknown fields silently
                }
                if (value === undefined || value === "")
                    continue;
                // Idempotent: skip if value is already identical
                if (currentEstate[key] === value)
                    continue;
                if (['deceasedDateOfDeath', 'willDate', 'deceasedDateOfBirth'].includes(key)) {
                    try {
                        updateData[key] = value ? new Date(value) : null;
                    }
                    catch (e) {
                        logger.warn(`[OnboardingService] Invalid date for ${key}:`, value);
                        continue;
                    }
                }
                else if (key.startsWith('estimated') || key === 'bondAmount') {
                    updateData[key] = typeof value === 'string' ? parseFloat(value) : value;
                }
                else {
                    updateData[key] = value;
                }
            }
            // ────── 3. Completion Logic ─────────────────────────────────────────
            if (step === 'completion' || data.onboardingStatus === OnboardingStatus.ROADMAP_GENERATED) {
                updateData.onboardingStatus = OnboardingStatus.ROADMAP_GENERATED;
                updateData.onboardingCompletedAt = new Date();
                updateData.estateStatus = EstateStatus.ACTIVE;
                updateData.completenessLevel = "MINIMUM_READY";
            }
            else if (currentEstate.onboardingStatus !== OnboardingStatus.ROADMAP_GENERATED) {
                updateData.onboardingStatus = OnboardingStatus.ASSESSMENT_INCOMPLETE;
            }
            if (onboardingVersion) {
                updateData.onboardingVersion = onboardingVersion;
            }
            // ────── 4. Auto-advance estate status to MINIMUM_READY when core data is complete ────
            if (currentEstate.estateStatus === EstateStatus.DRAFT) {
                const hasState = updateData.deceasedState || currentEstate.deceasedState;
                const hasAuthority = updateData.userSelectedEstateAuthorityType ||
                    currentEstate.userSelectedEstateAuthorityType ||
                    currentEstate.estateAuthorityType;
                if (hasState && hasAuthority) {
                    updateData.estateStatus = EstateStatus.MINIMUM_READY;
                    updateData.completenessLevel = "MINIMUM_READY";
                    logger.info(`[OnboardingService] Auto-advancing estate ${estateId} to MINIMUM_READY`);
                }
            }
            // ────── 5. Atomic Write ─────────────────────────────────────────
            if (Object.keys(updateData).length > 0) {
                try {
                    await tx.estate.update({
                        where: { id: estateId },
                        data: updateData
                    });
                    logger.info({
                        estateId, userId,
                        message: `[Onboarding] Unified update: ${currentEstate.onboardingStep} -> ${updateData.onboardingStep || currentEstate.onboardingStep}`,
                        fields: Object.keys(updateData)
                    });
                }
                catch (error) {
                    logger.error(`[OnboardingService] Failed to update estate`, {
                        estateId,
                        error: error.message,
                        stack: error.stack,
                        updateData
                    });
                    throw error;
                }
            }
            else {
                logger.info(`[OnboardingService] No fields to update`, { estateId, step });
            }
        });
    }
}
/**
 * Updates onboarding progress.
 *
 * Guarantees:
 * - IDEMPOTENT: Repeated calls with the same data produce no further effect.
 * - MONOTONIC: Progress cannot regress (step N cannot move back to step N-1).
 * - TRANSACTIONAL: All updates are atomic within a Prisma transaction.
 * - CONCURRENCY-SAFE: Uses step-rank comparison inside the transaction to
 *   prevent race conditions (optimistic concurrency via rank check).
 */
// Whitelist of Estate fields that can be updated via onboarding progress
OnboardingService.ALLOWED_FIELDS = new Set([
    'deceasedFirstName', 'deceasedLastName', 'deceasedDateOfDeath', 'deceasedDateOfBirth',
    'deceasedState', 'deceasedSsn', 'probateCounty',
    'hasWill', 'willDate', 'isSurvivingSpouse', 'hasContest',
    'hasOutOfStateProperty', 'hasTODDeed', 'hasUnknownHeirs',
    'isTrustRevocable', 'isOutOfState',
    'estimatedPersonalProperty', 'estimatedLiabilities',
    'hasMinorBeneficiaries', 'estateType', 'authorityType',
    'userSelectedEstateAuthorityType', 'administrationType',
    'hasProbateAssets', 'hasTrustAssets', 'hasBeneficiaryAssets',
    'assistedDecisionAnswers', 'authorityConfidenceScore',
    'authorityDeterminationSource',
]);
