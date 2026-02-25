import { describe, it, expect } from 'vitest';
import { calculateAuthorityRecommendation } from '../../lib/authorityEngine';

describe('Authority Engine', () => {
    it('should recommend FORMAL_PROBATE for high-value California estates', () => {
        const assets = [
            { value: 250000, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING' }
        ];
        const rec = calculateAuthorityRecommendation(assets, 'CA', { hasWill: true });

        expect(rec.type).toBe('FORMAL_PROBATE');
        expect(rec.authoritySource).toBe('COURT');
        expect(rec.procedureType).toBe('FORMAL_PROBATE');
    });

    it('should recommend SMALL_ESTATE for low-value California estates', () => {
        const assets = [
            { value: 50000, ownershipType: 'INDIVIDUAL' }
        ];
        const rec = calculateAuthorityRecommendation(assets, 'CA');

        expect(rec.type).toBe('SMALL_ESTATE');
        expect(rec.isEligibleForSmallEstate).toBe(true);
        expect(rec.activeEngines).toContain('AFFIDAVIT');
    });

    it('should recommend TRUST_ADMIN_REVOCABLE when trust assets exist', () => {
        const assets = [
            { value: 500000, inTrust: true }
        ];
        const rec = calculateAuthorityRecommendation(assets, 'CA', { isTrustRevocable: true });

        expect(rec.type).toBe('TRUST_ADMIN_REVOCABLE');
        expect(rec.authoritySource).toBe('FIDUCIARY_INSTRUMENT');
        expect(rec.activeEngines).toContain('TRUST');
    });

    it('should recommend INTESTATE when no will exists for high-value estates', () => {
        const assets = [
            { value: 300000, ownershipType: 'INDIVIDUAL' }
        ];
        const rec = calculateAuthorityRecommendation(assets, 'CA', { hasWill: false });

        expect(rec.type).toBe('INTESTATE');
    });

    it('should detect INSOLVENT modifier when debts exceed assets', () => {
        const assets = [
            { value: 10000, ownershipType: 'INDIVIDUAL' }
        ];
        const rec = calculateAuthorityRecommendation(assets, 'CA', { hasInsolvencyRisk: true });

        expect(rec.modifiers).toContain('INSOLVENT');
    });

    it('should recommend ANCILLARY_PROBATE for out-of-state property', () => {
        const assets = [
            { value: 100000, ownershipType: 'INDIVIDUAL' }
        ];
        const rec = calculateAuthorityRecommendation(assets, 'CA', { hasWill: true, isOutOfState: true });

        expect(rec.type).toBe('ANCILLARY_PROBATE');
        expect(rec.procedureType).toBe('ANCILLARY_PROBATE');
    });

    it('should recommend SPOUSAL_PETITION for surviving spouse claims', () => {
        const assets = [
            { value: 500000, ownershipType: 'INDIVIDUAL' }
        ];
        const rec = calculateAuthorityRecommendation(assets, 'CA', { isSpouse: true });

        expect(rec.type).toBe('SPOUSAL_PETITION');
    });

    it('should recommend POD_TOD_TRANSFER for beneficiary accounts', () => {
        const assets = [
            { value: 100000, ownershipType: 'BENEFICIARY' }
        ];
        const rec = calculateAuthorityRecommendation(assets, 'CA');

        expect(rec.type).toBe('POD_TOD_TRANSFER');
        expect(rec.activeEngines).toContain('POD_TOD_ACCOUNTS');
    });

    it('should recommend INFORMAL_PROBATE in UPC states like CO', () => {
        // Colorado is a UPC state (threshold is low, but informal is preferred)
        const assets = [
            { value: 100000, ownershipType: 'INDIVIDUAL' }
        ];
        const rec = calculateAuthorityRecommendation(assets, 'CO', { hasWill: true });

        expect(rec.type).toBe('INFORMAL_PROBATE');
    });

    it('should recommend MUNIMENT_OF_TITLE in Texas when applicable', () => {
        // TX threshold is $75,000. Muniment of Title is for wills under threshold.
        const assets = [
            { value: 50000, ownershipType: 'INDIVIDUAL' }
        ];
        const rec = calculateAuthorityRecommendation(assets, 'TX', { hasWill: true });

        expect(rec.type).toBe('MUNIMENT_OF_TITLE');
        expect(rec.procedureType).toBe('MUNIMENT_OF_TITLE');
    });
});
