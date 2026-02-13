import { describe, it, expect } from 'vitest';
import { classifyAsset, getSuggestedActions } from '../../lib/assetClassification';

describe('Asset Classification', () => {
    it('should classify COURT_REQUIRED as PROBATE', () => {
        const asset = { authorityType: 'COURT_REQUIRED', ownershipType: 'INDIVIDUAL' };
        expect(classifyAsset(asset)).toBe('PROBATE');
    });

    it('should classify AFFIDAVIT_SMALL as PROBATE', () => {
        const asset = { authorityType: 'AFFIDAVIT_SMALL', ownershipType: 'INDIVIDUAL' };
        expect(classifyAsset(asset)).toBe('PROBATE');
    });

    it('should classify TRUSTEE_DIRECT as NON_PROBATE', () => {
        const asset = { authorityType: 'TRUSTEE_DIRECT', ownershipType: 'TRUST' };
        expect(classifyAsset(asset)).toBe('NON_PROBATE');
    });

    it('should classify BENEFICIARY_CONTRACT as NON_PROBATE', () => {
        const asset = { authorityType: 'BENEFICIARY_CONTRACT', ownershipType: 'BENEFICIARY' };
        expect(classifyAsset(asset)).toBe('NON_PROBATE');
    });

    it('should classify SURVIVORSHIP_TITLE as NON_PROBATE', () => {
        const asset = { authorityType: 'SURVIVORSHIP_TITLE', ownershipType: 'JOINT' };
        expect(classifyAsset(asset)).toBe('NON_PROBATE');
    });

    it('should fallback to ownershipType INDIVIDUAL as PROBATE', () => {
        const asset = { ownershipType: 'INDIVIDUAL' };
        expect(classifyAsset(asset)).toBe('PROBATE');
    });

    it('should fallback to ownershipType TRUST as NON_PROBATE', () => {
        const asset = { ownershipType: 'TRUST' };
        expect(classifyAsset(asset)).toBe('NON_PROBATE');
    });
});

describe('Suggested Actions', () => {
    it('should suggest Notify Institution for discovered assets', () => {
        const asset = { status: 'discovered', institution: 'Bank of America' };
        const actions = getSuggestedActions(asset);
        expect(actions.some(a => a.id === 'notify_institution')).toBe(true);
    });

    it('should suggest Obtain DOD Value for probate assets without it', () => {
        const asset = { authorityType: 'COURT_REQUIRED', ownershipType: 'INDIVIDUAL' };
        const actions = getSuggestedActions(asset);
        expect(actions.some(a => a.id === 'obtain_dod_value')).toBe(true);
    });

    it('should suggest Await Letters for COURT_REQUIRED assets', () => {
        const asset = { authorityType: 'COURT_REQUIRED', ownershipType: 'INDIVIDUAL' };
        const actions = getSuggestedActions(asset);
        expect(actions.some(a => a.id === 'wait_for_letters')).toBe(true);
    });

    it('should suggest Initiate Direct Transfer for beneficiary contracts', () => {
        const asset = { authorityType: 'BENEFICIARY_CONTRACT', ownershipType: 'BENEFICIARY' };
        const actions = getSuggestedActions(asset);
        expect(actions.some(a => a.id === 'claim_transfer')).toBe(true);
    });

    it('should suggest Secure Property for real estate', () => {
        const asset = { assetType: 'REAL_ESTATE', category: 'property' };
        const actions = getSuggestedActions(asset);
        expect(actions.some(a => a.id === 'secure_property')).toBe(true);
    });
});
