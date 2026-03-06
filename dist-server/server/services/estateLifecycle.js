/**
 * Estate Lifecycle Service
 *
 * Manages the onboarding lifecycle and roadmap determinism contract.
 * Enforces the 5 invariants:
 * 1. No roadmap generation until assessment complete (all 7 dimensions)
 * 2. No dashboard access without roadmap
 * 3. No silent roadmap regeneration
 * 4. One canonical onboarding wizard
 * 5. Authority engine must not default missing dimensions
 */
import { OnboardingStatus } from '@prisma/client';
// ============================================================================
// VALIDATION: Assessment Completeness
// ============================================================================
/**
 * Validates that all 7 dimensions required for roadmap generation are present.
 *
 * The 7 dimensions are:
 * 1. hasWill - Boolean (required)
 * 2. isSurvivingSpouse - Boolean (required)
 * 3. hasContest - Boolean (required)
 * 4. hasOutOfStateProperty - Boolean (required)
 * 5. hasTODDeed - Boolean (required)
 * 6. isTrustRevocable - Boolean? (null means "no trust", which is valid)
 * 7. Insolvency Risk - Computed from estimatedPersonalProperty and estimatedLiabilities
 *
 * CRITICAL: Boolean fields with defaults cannot distinguish between "not answered"
 * and "answered false". We rely on the onboarding flow to ensure these are explicitly set.
 */
export function validateAssessmentComplete(estate) {
    const missingFields = [];
    const missingDimensions = [];
    // Dimension 1: hasWill (always required, boolean)
    if (estate.hasWill === undefined) {
        missingFields.push('hasWill');
        missingDimensions.push('Will Status');
    }
    // Dimension 2: isSurvivingSpouse (always required, boolean)
    if (estate.isSurvivingSpouse === undefined) {
        missingFields.push('isSurvivingSpouse');
        missingDimensions.push('Surviving Spouse Status');
    }
    // Dimension 3: hasContest (always required, boolean)
    if (estate.hasContest === undefined) {
        missingFields.push('hasContest');
        missingDimensions.push('Contest Status');
    }
    // Dimension 4: hasOutOfStateProperty (always required, boolean)
    if (estate.hasOutOfStateProperty === undefined) {
        missingFields.push('hasOutOfStateProperty');
        missingDimensions.push('Out-of-State Property');
    }
    // Dimension 5: hasTODDeed (always required, boolean)
    if (estate.hasTODDeed === undefined) {
        missingFields.push('hasTODDeed');
        missingDimensions.push('TOD Deed Status');
    }
    // Dimension 6: isTrustRevocable (nullable boolean - null is valid, undefined is not)
    // null = "no trust" (valid), undefined = "not answered" (invalid)
    if (estate.isTrustRevocable === undefined) {
        missingFields.push('isTrustRevocable');
        missingDimensions.push('Trust Type');
    }
    // Dimension 7: Financial estimates for insolvency calculation
    if (estate.estimatedPersonalProperty === null || estate.estimatedPersonalProperty === undefined) {
        missingFields.push('estimatedPersonalProperty');
        missingDimensions.push('Estimated Assets');
    }
    if (estate.estimatedLiabilities === null || estate.estimatedLiabilities === undefined) {
        missingFields.push('estimatedLiabilities');
        missingDimensions.push('Estimated Liabilities');
    }
    return {
        isComplete: missingFields.length === 0,
        missingFields,
        missingDimensions,
    };
}
// ============================================================================
// COMPUTATION: Insolvency Risk
// ============================================================================
/**
 * Computes insolvency risk from estate financials.
 *
 * This is the 7th dimension used by the authority engine.
 * Insolvency affects track selection and task prioritization.
 */
export function computeInsolvencyRisk(estate) {
    const assets = Number(estate.estimatedPersonalProperty || 0);
    const liabilities = Number(estate.estimatedLiabilities || 0);
    const netWorth = assets - liabilities;
    const isInsolvent = netWorth < 0;
    // Calculate risk level based on debt-to-asset ratio
    let riskLevel = 'NONE';
    if (assets === 0) {
        riskLevel = liabilities > 0 ? 'HIGH' : 'NONE';
    }
    else {
        const debtRatio = liabilities / assets;
        if (debtRatio >= 1.0) {
            riskLevel = 'HIGH'; // Insolvent
        }
        else if (debtRatio >= 0.75) {
            riskLevel = 'MEDIUM'; // Close to insolvency
        }
        else if (debtRatio >= 0.5) {
            riskLevel = 'LOW'; // Moderate debt
        }
        else {
            riskLevel = 'NONE'; // Healthy
        }
    }
    return {
        isInsolvent,
        totalAssets: assets,
        totalLiabilities: liabilities,
        netWorth,
        riskLevel,
    };
}
// ============================================================================
// DETECTION: Critical Field Changes
// ============================================================================
/**
 * Detects changes to fields that affect roadmap generation.
 *
 * Critical fields are the 7 dimensions that determine settlement track:
 * 1. hasWill
 * 2. isSurvivingSpouse
 * 3. hasContest
 * 4. hasOutOfStateProperty
 * 5. hasTODDeed
 * 6. isTrustRevocable
 * 7. Financial estimates (insolvency flip)
 *
 * When any of these change, the roadmap becomes stale and must be recomputed.
 */
export function detectCriticalFieldChanges(original, updated) {
    const changes = [];
    const staleReasons = [];
    // Check each dimension
    if (updated.hasWill !== undefined && updated.hasWill !== original.hasWill) {
        changes.push({
            field: 'hasWill',
            oldValue: original.hasWill,
            newValue: updated.hasWill,
            reason: 'Will status changed',
        });
        staleReasons.push('Will status changed');
    }
    if (updated.isSurvivingSpouse !== undefined && updated.isSurvivingSpouse !== original.isSurvivingSpouse) {
        changes.push({
            field: 'isSurvivingSpouse',
            oldValue: original.isSurvivingSpouse,
            newValue: updated.isSurvivingSpouse,
            reason: 'Surviving spouse status changed',
        });
        staleReasons.push('Surviving spouse status changed');
    }
    if (updated.hasContest !== undefined && updated.hasContest !== original.hasContest) {
        changes.push({
            field: 'hasContest',
            oldValue: original.hasContest,
            newValue: updated.hasContest,
            reason: 'Contest status changed',
        });
        staleReasons.push('Contest status changed');
    }
    if (updated.hasOutOfStateProperty !== undefined && updated.hasOutOfStateProperty !== original.hasOutOfStateProperty) {
        changes.push({
            field: 'hasOutOfStateProperty',
            oldValue: original.hasOutOfStateProperty,
            newValue: updated.hasOutOfStateProperty,
            reason: 'Out-of-state property status changed',
        });
        staleReasons.push('Out-of-state property status changed');
    }
    if (updated.hasTODDeed !== undefined && updated.hasTODDeed !== original.hasTODDeed) {
        changes.push({
            field: 'hasTODDeed',
            oldValue: original.hasTODDeed,
            newValue: updated.hasTODDeed,
            reason: 'TOD deed status changed',
        });
        staleReasons.push('TOD deed status changed');
    }
    if (updated.isTrustRevocable !== undefined && updated.isTrustRevocable !== original.isTrustRevocable) {
        changes.push({
            field: 'isTrustRevocable',
            oldValue: original.isTrustRevocable,
            newValue: updated.isTrustRevocable,
            reason: 'Trust type changed',
        });
        staleReasons.push('Trust type changed');
    }
    // Check for insolvency flip (most critical change)
    if ((updated.estimatedPersonalProperty !== undefined && updated.estimatedPersonalProperty !== original.estimatedPersonalProperty) ||
        (updated.estimatedLiabilities !== undefined && updated.estimatedLiabilities !== original.estimatedLiabilities)) {
        const oldInsolvency = computeInsolvencyRisk(original);
        const newInsolvency = computeInsolvencyRisk({
            estimatedPersonalProperty: updated.estimatedPersonalProperty ?? original.estimatedPersonalProperty,
            estimatedLiabilities: updated.estimatedLiabilities ?? original.estimatedLiabilities,
        });
        // Only flag if insolvency status actually flipped
        if (oldInsolvency.isInsolvent !== newInsolvency.isInsolvent) {
            changes.push({
                field: 'insolvencyStatus',
                oldValue: oldInsolvency.isInsolvent,
                newValue: newInsolvency.isInsolvent,
                reason: 'Solvency status changed',
            });
            staleReasons.push('Solvency status changed (critical)');
        }
        else if (Math.abs(oldInsolvency.netWorth - newInsolvency.netWorth) > 10000) {
            // Significant financial change (>$10k) even without insolvency flip
            changes.push({
                field: 'financials',
                oldValue: oldInsolvency.netWorth,
                newValue: newInsolvency.netWorth,
                reason: 'Significant financial change',
            });
            staleReasons.push('Financial estimates changed significantly');
        }
    }
    return {
        hasCriticalChanges: changes.length > 0,
        changes,
        staleReasons,
    };
}
// ============================================================================
// LIFECYCLE STATE TRANSITIONS
// ============================================================================
/**
 * Determines the appropriate onboardingStatus based on estate state.
 * Used during onboarding progression and backfill.
 */
export function determineOnboardingStatus(estate) {
    // If already stale, keep it stale
    if (estate.onboardingStatus === OnboardingStatus.ROADMAP_STALE_PENDING_RECOMPUTE) {
        return OnboardingStatus.ROADMAP_STALE_PENDING_RECOMPUTE;
    }
    // If roadmap exists, it's generated
    if (estate.roadmapVersion) {
        return OnboardingStatus.ROADMAP_GENERATED;
    }
    // Check if assessment is complete
    const validation = validateAssessmentComplete(estate);
    if (validation.isComplete) {
        return OnboardingStatus.ASSESSMENT_COMPLETE;
    }
    // Check if any assessment fields are filled (incomplete assessment)
    const hasAnyAssessmentData = estate.hasWill !== undefined ||
        estate.isSurvivingSpouse !== undefined ||
        estate.hasContest !== undefined ||
        estate.hasOutOfStateProperty !== undefined ||
        estate.hasTODDeed !== undefined ||
        estate.isTrustRevocable !== undefined ||
        estate.estimatedPersonalProperty !== null ||
        estate.estimatedLiabilities !== null;
    if (hasAnyAssessmentData) {
        return OnboardingStatus.ASSESSMENT_INCOMPLETE;
    }
    // Default: account created but no assessment started
    return OnboardingStatus.ACCOUNT_CREATED;
}
// ============================================================================
// VALIDATION HELPERS
// ============================================================================
/**
 * Checks if an estate can generate a roadmap.
 * Returns error message if not ready, null if ready.
 */
export function canGenerateRoadmap(estate) {
    const validation = validateAssessmentComplete(estate);
    if (!validation.isComplete) {
        return `Assessment incomplete. Missing: ${validation.missingDimensions.join(', ')}`;
    }
    return null;
}
/**
 * Checks if an estate can access the dashboard.
 * Returns error message if not ready, null if ready.
 */
export function canAccessDashboard(estate) {
    if (estate.onboardingStatus !== OnboardingStatus.ROADMAP_GENERATED &&
        estate.onboardingStatus !== OnboardingStatus.ROADMAP_STALE_PENDING_RECOMPUTE) {
        return 'Roadmap not generated. Please complete onboarding first.';
    }
    if (!estate.roadmapVersion) {
        return 'Roadmap not found. Please generate your roadmap.';
    }
    return null;
}
