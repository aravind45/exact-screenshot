import { describe, it, expect } from 'vitest';
import { calculateAuthorityRecommendation, UPC_STATES } from '@/lib/authorityEngine';

describe('Settlement Type Auto-Detection', () => {
    describe('SPOUSAL_PETITION Detection', () => {
        it('should detect SPOUSAL_PETITION when isSpouse is true (CA)', () => {
            const result = calculateAuthorityRecommendation(
                [],
                'CA',
                {
                    isSpouse: true,
                    estimatedValue: 300000,
                    hasWill: true
                }
            );

            expect(result.type).toBe('SPOUSAL_PETITION');
            expect(result.legalTerm).toBe('DE-221 Spousal Property Petition');
            expect(result.reason).toContain('surviving spouse');
        });

        it('should detect SPOUSAL_PETITION when isSpouse is true (other states)', () => {
            const result = calculateAuthorityRecommendation(
                [],
                'NY',
                {
                    isSpouse: true,
                    estimatedValue: 200000,
                    hasWill: true
                }
            );

            expect(result.type).toBe('SPOUSAL_PETITION');
            expect(result.legalTerm).toBe('Spousal Set-Aside');
        });

        it('should NOT detect SPOUSAL_PETITION when isSpouse is false', () => {
            const result = calculateAuthorityRecommendation(
                [],
                'CA',
                {
                    isSpouse: false,
                    estimatedValue: 300000,
                    hasWill: true
                }
            );

            expect(result.type).not.toBe('SPOUSAL_PETITION');
        });
    });

    describe('INFORMAL_PROBATE Detection', () => {
        it('should detect INFORMAL_PROBATE in UPC state (CO)', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 200000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                'CO',
                {
                    hasWill: true,
                    hasContest: false
                }
            );

            expect(result.type).toBe('INFORMAL_PROBATE');
            expect(result.legalTerm).toBe('Informal Probate (UPC)');
            expect(result.reason).toContain('Uniform Probate Code');
        });

        it('should detect INFORMAL_PROBATE in all UPC states', () => {
            UPC_STATES.forEach(state => {
                const result = calculateAuthorityRecommendation(
                    [{ value: 200000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                    state,
                    {
                        hasWill: true,
                        hasContest: false
                    }
                );

                expect(result.type).toBe('INFORMAL_PROBATE');
                expect(result.legalTerm).toBe('Informal Probate (UPC)');
            });
        });

        it('should NOT detect INFORMAL_PROBATE in non-UPC state', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 200000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                'CA',  // California is NOT a UPC state
                {
                    hasWill: true,
                    hasContest: false
                }
            );

            expect(result.type).not.toBe('INFORMAL_PROBATE');
            expect(result.type).toBe('FORMAL_PROBATE');
        });

        it('should NOT detect INFORMAL_PROBATE when estate is contested', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 200000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                'CO',
                {
                    hasWill: true,
                    hasContest: true  // Contested estate
                }
            );

            expect(result.type).not.toBe('INFORMAL_PROBATE');
            expect(result.type).toBe('FORMAL_PROBATE');
        });

        it('should NOT detect INFORMAL_PROBATE when no will exists', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 200000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                'CO',
                {
                    hasWill: false,  // No will
                    hasContest: false
                }
            );

            expect(result.type).not.toBe('INFORMAL_PROBATE');
            expect(result.type).toBe('INTESTATE');
        });
    });

    describe('MUNIMENT_OF_TITLE Detection', () => {
        it('should detect MUNIMENT_OF_TITLE in TX with will and no insolvency', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 150000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                'TX',
                {
                    hasWill: true,
                    hasInsolvencyRisk: false
                }
            );

            expect(result.type).toBe('MUNIMENT_OF_TITLE');
            expect(result.legalTerm).toBe('Muniment of Title');
        });

        it('should NOT detect MUNIMENT_OF_TITLE when estate is insolvent', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 150000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                'TX',
                {
                    hasWill: true,
                    hasInsolvencyRisk: true  // Insolvent
                }
            );

            expect(result.type).not.toBe('MUNIMENT_OF_TITLE');
        });

        it('should NOT detect MUNIMENT_OF_TITLE in non-TX state', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 150000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                'CA',
                {
                    hasWill: true,
                    hasInsolvencyRisk: false
                }
            );

            expect(result.type).not.toBe('MUNIMENT_OF_TITLE');
        });
    });

    describe('SMALL_ESTATE Detection', () => {
        it('should detect SMALL_ESTATE when below threshold (CA)', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 150000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                'CA',
                {
                    hasWill: true
                }
            );

            expect(result.type).toBe('SMALL_ESTATE');
            expect(result.isEligibleForSmallEstate).toBe(true);
        });

        it('should NOT detect SMALL_ESTATE when above threshold', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 200000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                'CA',
                {
                    hasWill: true
                }
            );

            expect(result.type).not.toBe('SMALL_ESTATE');
            expect(result.isEligibleForSmallEstate).toBe(false);
        });
    });

    describe('ANCILLARY_PROBATE Detection', () => {
        it('should detect ANCILLARY_PROBATE when isOutOfState is true', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 200000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                'CA',
                {
                    isOutOfState: true,
                    hasWill: true
                }
            );

            expect(result.type).toBe('ANCILLARY_PROBATE');
            expect(result.legalTerm).toBe('Ancillary Administration');
        });
    });

    describe('INTESTATE Detection', () => {
        it('should detect INTESTATE when hasWill is false', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 200000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                'CA',
                {
                    hasWill: false
                }
            );

            expect(result.type).toBe('INTESTATE');
            expect(result.legalTerm).toBe('Intestate Administration');
        });
    });

    describe('Priority Order', () => {
        it('should prioritize ANCILLARY_PROBATE over INFORMAL_PROBATE', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 200000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                'CO',  // UPC state
                {
                    hasWill: true,
                    isOutOfState: true,  // Out of state property
                    hasContest: false
                }
            );

            expect(result.type).toBe('ANCILLARY_PROBATE');
        });

        it('should prioritize SPOUSAL_PETITION over INFORMAL_PROBATE', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 200000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset
                'CO',  // UPC state
                {
                    hasWill: true,
                    isSpouse: true,  // Surviving spouse
                    hasContest: false
                }
            );

            expect(result.type).toBe('SPOUSAL_PETITION');
        });

        it('should prioritize SMALL_ESTATE over INFORMAL_PROBATE', () => {
            const result = calculateAuthorityRecommendation(
                [{ value: 40000, ownershipType: 'INDIVIDUAL' }],  // Add actual asset below threshold
                'CO',  // UPC state
                {
                    hasWill: true,
                    hasContest: false
                }
            );

            expect(result.type).toBe('SMALL_ESTATE');
        });
    });
});
