/**
 * Unit Tests: Estate Lifecycle Service
 *
 * Tests the validation, computation, and detection functions that enforce
 * the onboarding lifecycle and roadmap determinism contract.
 */
import { describe, it, expect } from 'vitest';
import { validateAssessmentComplete, computeInsolvencyRisk, detectCriticalFieldChanges, determineOnboardingStatus, canGenerateRoadmap, canAccessDashboard, } from '../estateLifecycle.js';
import { OnboardingStatus, Prisma } from '@prisma/client';
describe('Estate Lifecycle Service', () => {
    describe('validateAssessmentComplete', () => {
        it('should pass validation when all 7 dimensions are present', () => {
            const estate = {
                hasWill: true,
                isSurvivingSpouse: false,
                hasContest: false,
                hasOutOfStateProperty: false,
                hasTODDeed: false,
                isTrustRevocable: null, // null is valid (means "no trust")
                estimatedPersonalProperty: 100000,
                estimatedLiabilities: 50000,
            };
            const result = validateAssessmentComplete(estate);
            expect(result.isComplete).toBe(true);
            expect(result.missingFields).toHaveLength(0);
            expect(result.missingDimensions).toHaveLength(0);
        });
        it('should fail validation when hasWill is missing', () => {
            const estate = {
                hasWill: undefined,
                isSurvivingSpouse: false,
                hasContest: false,
                hasOutOfStateProperty: false,
                hasTODDeed: false,
                isTrustRevocable: null,
                estimatedPersonalProperty: 100000,
                estimatedLiabilities: 50000,
            };
            const result = validateAssessmentComplete(estate);
            expect(result.isComplete).toBe(false);
            expect(result.missingFields).toContain('hasWill');
            expect(result.missingDimensions).toContain('Will Status');
        });
        it('should fail validation when financial estimates are missing', () => {
            const estate = {
                hasWill: true,
                isSurvivingSpouse: false,
                hasContest: false,
                hasOutOfStateProperty: false,
                hasTODDeed: false,
                isTrustRevocable: null,
                estimatedPersonalProperty: null,
                estimatedLiabilities: null,
            };
            const result = validateAssessmentComplete(estate);
            expect(result.isComplete).toBe(false);
            expect(result.missingFields).toContain('estimatedPersonalProperty');
            expect(result.missingFields).toContain('estimatedLiabilities');
            expect(result.missingDimensions).toContain('Estimated Assets');
            expect(result.missingDimensions).toContain('Estimated Liabilities');
        });
        it('should accept isTrustRevocable as null (no trust)', () => {
            const estate = {
                hasWill: true,
                isSurvivingSpouse: false,
                hasContest: false,
                hasOutOfStateProperty: false,
                hasTODDeed: false,
                isTrustRevocable: null, // null = "no trust" (valid)
                estimatedPersonalProperty: 100000,
                estimatedLiabilities: 50000,
            };
            const result = validateAssessmentComplete(estate);
            expect(result.isComplete).toBe(true);
        });
        it('should reject isTrustRevocable as undefined (not answered)', () => {
            const estate = {
                hasWill: true,
                isSurvivingSpouse: false,
                hasContest: false,
                hasOutOfStateProperty: false,
                hasTODDeed: false,
                isTrustRevocable: undefined, // undefined = "not answered" (invalid)
                estimatedPersonalProperty: 100000,
                estimatedLiabilities: 50000,
            };
            const result = validateAssessmentComplete(estate);
            expect(result.isComplete).toBe(false);
            expect(result.missingFields).toContain('isTrustRevocable');
        });
    });
    describe('computeInsolvencyRisk', () => {
        it('should detect insolvency when liabilities exceed assets', () => {
            const estate = {
                estimatedPersonalProperty: 50000,
                estimatedLiabilities: 100000,
            };
            const result = computeInsolvencyRisk(estate);
            expect(result.isInsolvent).toBe(true);
            expect(result.totalAssets).toBe(50000);
            expect(result.totalLiabilities).toBe(100000);
            expect(result.netWorth).toBe(-50000);
            expect(result.riskLevel).toBe('HIGH');
        });
        it('should detect solvency when assets exceed liabilities', () => {
            const estate = {
                estimatedPersonalProperty: 100000,
                estimatedLiabilities: 50000,
            };
            const result = computeInsolvencyRisk(estate);
            expect(result.isInsolvent).toBe(false);
            expect(result.netWorth).toBe(50000);
            expect(result.riskLevel).toBe('LOW');
        });
        it('should handle zero assets and liabilities', () => {
            const estate = {
                estimatedPersonalProperty: 0,
                estimatedLiabilities: 0,
            };
            const result = computeInsolvencyRisk(estate);
            expect(result.isInsolvent).toBe(false);
            expect(result.netWorth).toBe(0);
            expect(result.riskLevel).toBe('NONE');
        });
        it('should calculate correct risk levels based on debt ratio', () => {
            // HIGH risk: debt ratio >= 1.0
            expect(computeInsolvencyRisk({ estimatedPersonalProperty: 100000, estimatedLiabilities: 100000 }).riskLevel).toBe('HIGH');
            // MEDIUM risk: debt ratio >= 0.75
            expect(computeInsolvencyRisk({ estimatedPersonalProperty: 100000, estimatedLiabilities: 80000 }).riskLevel).toBe('MEDIUM');
            // LOW risk: debt ratio >= 0.5
            expect(computeInsolvencyRisk({ estimatedPersonalProperty: 100000, estimatedLiabilities: 60000 }).riskLevel).toBe('LOW');
            // NONE risk: debt ratio < 0.5
            expect(computeInsolvencyRisk({ estimatedPersonalProperty: 100000, estimatedLiabilities: 40000 }).riskLevel).toBe('NONE');
        });
    });
    describe('detectCriticalFieldChanges', () => {
        const baseEstate = {
            hasWill: true,
            isSurvivingSpouse: false,
            hasContest: false,
            hasOutOfStateProperty: false,
            hasTODDeed: false,
            isTrustRevocable: null,
            estimatedPersonalProperty: 100000,
            estimatedLiabilities: 50000,
        };
        it('should detect no changes when nothing is updated', () => {
            const result = detectCriticalFieldChanges(baseEstate, {});
            expect(result.hasCriticalChanges).toBe(false);
            expect(result.changes).toHaveLength(0);
            expect(result.staleReasons).toHaveLength(0);
        });
        it('should detect hasWill change', () => {
            const result = detectCriticalFieldChanges(baseEstate, { hasWill: false });
            expect(result.hasCriticalChanges).toBe(true);
            expect(result.changes).toHaveLength(1);
            expect(result.changes[0].field).toBe('hasWill');
            expect(result.staleReasons).toContain('Will status changed');
        });
        it('should detect isSurvivingSpouse change', () => {
            const result = detectCriticalFieldChanges(baseEstate, { isSurvivingSpouse: true });
            expect(result.hasCriticalChanges).toBe(true);
            expect(result.staleReasons).toContain('Surviving spouse status changed');
        });
        it('should detect insolvency flip', () => {
            const result = detectCriticalFieldChanges(baseEstate, {
                estimatedLiabilities: new Prisma.Decimal(150000), // Flips from solvent to insolvent
            });
            expect(result.hasCriticalChanges).toBe(true);
            expect(result.changes.some(c => c.field === 'insolvencyStatus')).toBe(true);
            expect(result.staleReasons).toContain('Solvency status changed (critical)');
        });
        it('should detect significant financial change without insolvency flip', () => {
            const result = detectCriticalFieldChanges(baseEstate, {
                estimatedPersonalProperty: new Prisma.Decimal(120000), // +$20k change, but still solvent
            });
            expect(result.hasCriticalChanges).toBe(true);
            expect(result.changes.some(c => c.field === 'financials')).toBe(true);
            expect(result.staleReasons).toContain('Financial estimates changed significantly');
        });
        it('should not flag minor financial changes', () => {
            const result = detectCriticalFieldChanges(baseEstate, {
                estimatedPersonalProperty: new Prisma.Decimal(105000), // Only $5k change
            });
            expect(result.hasCriticalChanges).toBe(false);
        });
        it('should detect multiple changes', () => {
            const result = detectCriticalFieldChanges(baseEstate, {
                hasWill: false,
                hasContest: true,
                estimatedLiabilities: new Prisma.Decimal(150000),
            });
            expect(result.hasCriticalChanges).toBe(true);
            expect(result.changes.length).toBeGreaterThanOrEqual(3);
            expect(result.staleReasons).toContain('Will status changed');
            expect(result.staleReasons).toContain('Contest status changed');
            expect(result.staleReasons).toContain('Solvency status changed (critical)');
        });
    });
    describe('determineOnboardingStatus', () => {
        it('should return ACCOUNT_CREATED for new estate with no data', () => {
            const estate = {
                hasWill: undefined,
                isSurvivingSpouse: undefined,
                hasContest: undefined,
                hasOutOfStateProperty: undefined,
                hasTODDeed: undefined,
                isTrustRevocable: undefined,
                estimatedPersonalProperty: null,
                estimatedLiabilities: null,
                roadmapVersion: null,
                onboardingStatus: OnboardingStatus.ACCOUNT_CREATED,
            };
            const result = determineOnboardingStatus(estate);
            expect(result).toBe(OnboardingStatus.ACCOUNT_CREATED);
        });
        it('should return ASSESSMENT_INCOMPLETE when some fields are filled', () => {
            const estate = {
                hasWill: true,
                isSurvivingSpouse: false,
                hasContest: undefined, // Missing
                hasOutOfStateProperty: undefined, // Missing
                hasTODDeed: undefined, // Missing
                isTrustRevocable: undefined, // Missing
                estimatedPersonalProperty: null,
                estimatedLiabilities: null,
                roadmapVersion: null,
                onboardingStatus: OnboardingStatus.ACCOUNT_CREATED,
            };
            const result = determineOnboardingStatus(estate);
            expect(result).toBe(OnboardingStatus.ASSESSMENT_INCOMPLETE);
        });
        it('should return ASSESSMENT_COMPLETE when all fields are filled but no roadmap', () => {
            const estate = {
                hasWill: true,
                isSurvivingSpouse: false,
                hasContest: false,
                hasOutOfStateProperty: false,
                hasTODDeed: false,
                isTrustRevocable: null,
                estimatedPersonalProperty: 100000,
                estimatedLiabilities: 50000,
                roadmapVersion: null,
                onboardingStatus: OnboardingStatus.ACCOUNT_CREATED,
            };
            const result = determineOnboardingStatus(estate);
            expect(result).toBe(OnboardingStatus.ASSESSMENT_COMPLETE);
        });
        it('should return ROADMAP_GENERATED when roadmap exists', () => {
            const estate = {
                hasWill: true,
                isSurvivingSpouse: false,
                hasContest: false,
                hasOutOfStateProperty: false,
                hasTODDeed: false,
                isTrustRevocable: null,
                estimatedPersonalProperty: 100000,
                estimatedLiabilities: 50000,
                roadmapVersion: 'v1.0.0',
                onboardingStatus: OnboardingStatus.ASSESSMENT_COMPLETE,
            };
            const result = determineOnboardingStatus(estate);
            expect(result).toBe(OnboardingStatus.ROADMAP_GENERATED);
        });
        it('should preserve ROADMAP_STALE_PENDING_RECOMPUTE status', () => {
            const estate = {
                hasWill: true,
                isSurvivingSpouse: false,
                hasContest: false,
                hasOutOfStateProperty: false,
                hasTODDeed: false,
                isTrustRevocable: null,
                estimatedPersonalProperty: 100000,
                estimatedLiabilities: 50000,
                roadmapVersion: 'v1.0.0',
                onboardingStatus: OnboardingStatus.ROADMAP_STALE_PENDING_RECOMPUTE,
            };
            const result = determineOnboardingStatus(estate);
            expect(result).toBe(OnboardingStatus.ROADMAP_STALE_PENDING_RECOMPUTE);
        });
    });
    describe('canGenerateRoadmap', () => {
        it('should allow generation when assessment is complete', () => {
            const estate = {
                hasWill: true,
                isSurvivingSpouse: false,
                hasContest: false,
                hasOutOfStateProperty: false,
                hasTODDeed: false,
                isTrustRevocable: null,
                estimatedPersonalProperty: 100000,
                estimatedLiabilities: 50000,
                onboardingStatus: OnboardingStatus.ASSESSMENT_COMPLETE,
            };
            const result = canGenerateRoadmap(estate);
            expect(result).toBeNull();
        });
        it('should block generation when assessment is incomplete', () => {
            const estate = {
                hasWill: undefined,
                isSurvivingSpouse: false,
                hasContest: false,
                hasOutOfStateProperty: false,
                hasTODDeed: false,
                isTrustRevocable: null,
                estimatedPersonalProperty: null,
                estimatedLiabilities: null,
                onboardingStatus: OnboardingStatus.ASSESSMENT_INCOMPLETE,
            };
            const result = canGenerateRoadmap(estate);
            expect(result).not.toBeNull();
            expect(result).toContain('Assessment incomplete');
        });
    });
    describe('canAccessDashboard', () => {
        it('should allow access when roadmap is generated', () => {
            const estate = {
                onboardingStatus: OnboardingStatus.ROADMAP_GENERATED,
                roadmapVersion: 'v1.0.0',
            };
            const result = canAccessDashboard(estate);
            expect(result).toBeNull();
        });
        it('should allow access when roadmap is stale but exists', () => {
            const estate = {
                onboardingStatus: OnboardingStatus.ROADMAP_STALE_PENDING_RECOMPUTE,
                roadmapVersion: 'v1.0.0',
            };
            const result = canAccessDashboard(estate);
            expect(result).toBeNull();
        });
        it('should block access when onboarding not complete', () => {
            const estate = {
                onboardingStatus: OnboardingStatus.ASSESSMENT_INCOMPLETE,
                roadmapVersion: null,
            };
            const result = canAccessDashboard(estate);
            expect(result).not.toBeNull();
            expect(result).toContain('Roadmap not generated');
        });
        it('should block access when roadmap does not exist', () => {
            const estate = {
                onboardingStatus: OnboardingStatus.ROADMAP_GENERATED,
                roadmapVersion: null,
            };
            const result = canAccessDashboard(estate);
            expect(result).not.toBeNull();
            expect(result).toContain('Roadmap not found');
        });
    });
});
