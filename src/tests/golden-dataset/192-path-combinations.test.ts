/**
 * 192 Path Combination Unit Tests
 * 
 * Tests the determinePath() function from pathEngine.ts against all 192
 * combinations of the 7 UserAnswers fields (excluding trustType, which is
 * conditional on hasTrust='yes').
 *
 * Combination count:
 *   hasWill(2) × hasTrust(2) × [trustType(2) when hasTrust=yes, else 1] ×
 *   hasTODDeed(2) × hasContest(2) × isOutOfState(2) × isSpouse(2) × debtStatus(2)
 *
 *   When hasTrust='yes': 2×2×2×2×2×2×2 = 128 combos (trust-type varies)
 *   When hasTrust='no': 2×1×2×2×2×2×2 = 64 combos
 *   Total = 128 + 64 = 192 ✓
 */

import { describe, it, expect } from 'vitest';
import { determinePath, type UserAnswers } from '../../lib/pathEngine';

// Valid path IDs from the authorityEngine / pathEngine
const VALID_PATH_IDS = new Set([
    'SMALL_ESTATE',
    'TRUST_ADMIN_REVOCABLE',
    'TRUST_ADMIN_IRREVOCABLE',
    'INFORMAL_PROBATE',
    'FORMAL_PROBATE',
    'INTESTATE',
    'CONTESTED_ESTATE',
    'INSOLVENT_ESTATE',
    'ANCILLARY_PROBATE',
    'SUMMARY_ADMINISTRATION',
    'VOLUNTARY_ADMINISTRATION',
    'SPOUSAL_PETITION',
    'MUNIMENT_OF_TITLE',
    'POUR_OVER_WILL',
    'UNSET',
    // Other valid authority types that may be returned
    'JOINT_TRANSFER',
    'POD_TOD_TRANSFER',
    'BENEFICIARY_DESIGNATED',
    'TOD_DEED',
    'UNCLAIMED_ESTATE',
    'ELECTIVE_SHARE',
    'FAMILY_ALLOWANCE',
    'DISCOVERY',
    'BUSINESS_ESTATE',
]);

const VALID_COMPLEXITY = new Set(['Simple', 'Medium', 'Complex']);
const VALID_DEBT = ['solvent', 'insolvent', 'not_sure'] as const;
const VALID_HASYN = ['yes', 'no', 'not_sure'] as const;
const VALID_TRUSTTYPE = ['revocable', 'irrevocable', 'none', 'not_sure'] as const;

/** Generate all 192 combinations programmatically */
function generateAllCombinations(): UserAnswers[] {
    const combinations: UserAnswers[] = [];
    const yesNo = ['yes', 'no'] as const;
    const debtStatuses = ['solvent', 'insolvent'] as const;
    const trustTypes = ['revocable', 'irrevocable'] as const;

    for (const hasWill of yesNo) {
        for (const hasTrust of yesNo) {
            const trustTypeOptions = hasTrust === 'yes' ? trustTypes : (['none'] as const);
            for (const trustType of trustTypeOptions) {
                for (const hasTODDeed of yesNo) {
                    for (const hasContest of yesNo) {
                        for (const isOutOfState of yesNo) {
                            for (const isSpouse of yesNo) {
                                for (const debtStatus of debtStatuses) {
                                    combinations.push({
                                        hasWill,
                                        hasTrust,
                                        trustType,
                                        hasTODDeed,
                                        hasContest,
                                        isOutOfState,
                                        isSpouse,
                                        debtStatus,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return combinations;
}

const ALL_192 = generateAllCombinations();
const TEST_STATE = 'CA'; // California as representative state

describe('192 Path Combination Tests — pathEngine.determinePath()', () => {
    it('should generate exactly 192 combinations', () => {
        expect(ALL_192.length).toBe(192);
    });

    describe('all combinations return a valid PathResult', () => {
        ALL_192.forEach((combo, idx) => {
            const label = `combo #${idx + 1}: hasWill=${combo.hasWill} hasTrust=${combo.hasTrust}${combo.hasTrust === 'yes' ? ` trustType=${combo.trustType}` : ''} hasTODDeed=${combo.hasTODDeed} hasContest=${combo.hasContest} isOutOfState=${combo.isOutOfState} isSpouse=${combo.isSpouse} debtStatus=${combo.debtStatus}`;

            it(label, () => {
                const result = determinePath(combo, TEST_STATE);

                // 1. result must be defined
                expect(result).toBeDefined();

                // 2. pathId must be a non-empty string
                expect(typeof result.pathId).toBe('string');
                expect(result.pathId.length).toBeGreaterThan(0);

                // 3. pathLabel must be a non-empty string
                expect(typeof result.pathLabel).toBe('string');
                expect(result.pathLabel.length).toBeGreaterThan(0);

                // 4. complexity must be one of the three valid values
                expect(VALID_COMPLEXITY.has(result.complexity)).toBe(true);

                // 5. timeline must be a non-empty string
                expect(typeof result.timeline).toBe('string');
                expect(result.timeline.length).toBeGreaterThan(0);

                // 6. confidence must be a number in [0, 100]
                expect(typeof result.confidence).toBe('number');
                expect(result.confidence).toBeGreaterThanOrEqual(0);
                expect(result.confidence).toBeLessThanOrEqual(100);

                // 7. modifiers must be an array
                expect(Array.isArray(result.modifiers)).toBe(true);

                // 8. nextSteps must be a non-empty array of strings
                expect(Array.isArray(result.nextSteps)).toBe(true);
                expect(result.nextSteps.length).toBeGreaterThan(0);
                result.nextSteps.forEach(step => {
                    expect(typeof step).toBe('string');
                    expect(step.length).toBeGreaterThan(0);
                });
            });
        });
    });

    describe('business logic spot checks', () => {
        it('contested estate should include CONTESTED modifier', () => {
            const result = determinePath({
                hasWill: 'yes',
                hasTrust: 'no',
                hasTODDeed: 'no',
                hasContest: 'yes',
                isOutOfState: 'no',
                isSpouse: 'no',
                debtStatus: 'solvent',
            }, TEST_STATE);
            // Either the pathId is CONTESTED_ESTATE or modifiers include CONTESTED
            const isContested =
                result.pathId === 'CONTESTED_ESTATE' ||
                result.modifiers.includes('CONTESTED') ||
                result.modifiers.includes('CONTESTED_ESTATE');
            expect(isContested).toBe(true);
        });

        it('insolvent estate should include INSOLVENT modifier or path', () => {
            const result = determinePath({
                hasWill: 'yes',
                hasTrust: 'no',
                hasTODDeed: 'no',
                hasContest: 'no',
                isOutOfState: 'no',
                isSpouse: 'no',
                debtStatus: 'insolvent',
            }, TEST_STATE);
            const isInsolvent =
                result.pathId === 'INSOLVENT_ESTATE' ||
                result.modifiers.includes('INSOLVENT');
            expect(isInsolvent).toBe(true);
        });

        it('revocable trust should route to TRUST_ADMIN_REVOCABLE', () => {
            const result = determinePath({
                hasWill: 'yes',
                hasTrust: 'yes',
                trustType: 'revocable',
                hasTODDeed: 'no',
                hasContest: 'no',
                isOutOfState: 'no',
                isSpouse: 'no',
                debtStatus: 'solvent',
            }, TEST_STATE);
            expect(result.pathId).toBe('TRUST_ADMIN_REVOCABLE');
        });

        it('irrevocable trust should route to TRUST_ADMIN_IRREVOCABLE', () => {
            const result = determinePath({
                hasWill: 'yes',
                hasTrust: 'yes',
                trustType: 'irrevocable',
                hasTODDeed: 'no',
                hasContest: 'no',
                isOutOfState: 'no',
                isSpouse: 'no',
                debtStatus: 'solvent',
            }, TEST_STATE);
            expect(result.pathId).toBe('TRUST_ADMIN_IRREVOCABLE');
        });

        it('out-of-state executor should trigger ANCILLARY_PROBATE', () => {
            const result = determinePath({
                hasWill: 'yes',
                hasTrust: 'no',
                hasTODDeed: 'no',
                hasContest: 'no',
                isOutOfState: 'yes',
                isSpouse: 'no',
                debtStatus: 'solvent',
            }, TEST_STATE);
            expect(result.pathId).toBe('ANCILLARY_PROBATE');
        });

        it('all-not_sure should return a valid conservative fallback', () => {
            const result = determinePath({
                hasWill: 'not_sure',
                hasTrust: 'not_sure',
                hasTODDeed: 'not_sure',
                hasContest: 'not_sure',
                isOutOfState: 'not_sure',
                isSpouse: 'not_sure',
                debtStatus: 'not_sure',
            }, TEST_STATE);
            expect(result).toBeDefined();
            expect(result.pathId.length).toBeGreaterThan(0);
            // Confidence should be low for all-uncertain
            expect(result.confidence).toBeLessThan(50);
        });

        it('confidence should be 100% when all fields are definitive', () => {
            const result = determinePath({
                hasWill: 'yes',
                hasTrust: 'no',
                hasTODDeed: 'no',
                hasContest: 'no',
                isOutOfState: 'no',
                isSpouse: 'no',
                debtStatus: 'solvent',
            }, TEST_STATE);
            expect(result.confidence).toBe(100);
        });
    });

    describe('multi-state tests (spot check key combos across states)', () => {
        const STATES = ['CA', 'TX', 'FL', 'NY', 'WA'];

        it('trust admin path should be consistent across major states', () => {
            const combo: UserAnswers = {
                hasWill: 'yes',
                hasTrust: 'yes',
                trustType: 'revocable',
                hasTODDeed: 'no',
                hasContest: 'no',
                isOutOfState: 'no',
                isSpouse: 'no',
                debtStatus: 'solvent',
            };

            for (const state of STATES) {
                const result = determinePath(combo, state);
                expect(result).toBeDefined();
                expect(result.pathId).toBe('TRUST_ADMIN_REVOCABLE');
            }
        });

        it('contested estate path should be consistent across major states', () => {
            const combo: UserAnswers = {
                hasWill: 'yes',
                hasTrust: 'no',
                hasTODDeed: 'no',
                hasContest: 'yes',
                isOutOfState: 'no',
                isSpouse: 'no',
                debtStatus: 'solvent',
            };

            for (const state of STATES) {
                const result = determinePath(combo, state);
                const isContested =
                    result.pathId === 'CONTESTED_ESTATE' ||
                    result.modifiers.includes('CONTESTED') ||
                    result.modifiers.includes('CONTESTED_ESTATE');
                expect(isContested).toBe(true);
            }
        });
    });
});
