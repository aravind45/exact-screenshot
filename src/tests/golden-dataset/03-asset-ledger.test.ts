/**
 * Golden Dataset Tests: Asset Ledger
 * Tests cases 141-280 from GOLDEN_DATASET_EDGE_CASES.md
 */

import { describe, it, expect } from 'vitest';
import { classifyAsset } from '../../lib/assetClassification';
import { getAssetAuthorityType, STATE_THRESHOLDS } from '../../lib/authorityEngine';

// Use production CA threshold
const CA_THRESHOLD = STATE_THRESHOLDS['CA'] || 184500;

interface Asset {
    id: string;
    assetType?: string;
    description: string;
    value: number;
    ownershipType: string;
    hasLien?: boolean;
    hasBeneficiary?: boolean;
    beneficiaryDesignation?: string;
    inTrust?: boolean;
    todDeedRecorded?: boolean;
}

// Validate asset value (restored for golden dataset consistency)
function validateAssetValue(value: number): { valid: boolean; error?: string } {
    if (value < 0) return { valid: false, error: 'Asset value cannot be negative' };
    if (value > 1000000000000) return { valid: false, error: 'Asset value unrealistically high' };
    return { valid: true };
}

// Wrapper to match production classifyAsset interface
function requiresProbate(asset: Asset): boolean {
    return classifyAsset({
        authorityType: getAssetAuthorityType(asset, CA_THRESHOLD),
        ownershipType: asset.ownershipType
    }) === 'PROBATE';
}

// Calculate total estate value
function calculateEstateValue(assets: Asset[]): number {
    return assets.reduce((total, asset) => total + (asset.value || 0), 0);
}

// Identify probate assets
function getProbateAssets(assets: Asset[]): Asset[] {
    return assets.filter(requiresProbate);
}

// Identify non-probate assets
function getNonProbateAssets(assets: Asset[]): Asset[] {
    return assets.filter(asset => !requiresProbate(asset));
}

describe('Golden Dataset: Real Property (Cases 141-170)', () => {
    it('Case 141: Single-family home (primary residence)', () => {
        const asset: Asset = {
            id: '1',
            assetType: 'real_property',
            description: 'Primary residence',
            value: 750000,
            ownershipType: 'INDIVIDUAL'
        };

        expect(validateAssetValue(asset.value).valid).toBe(true);
        expect(requiresProbate(asset)).toBe(true);
    });

    it('Case 142: Vacation home (second property)', () => {
        const asset: Asset = {
            id: '2',
            assetType: 'real_property',
            description: 'Vacation home',
            value: 500000,
            ownershipType: 'INDIVIDUAL'
        };

        expect(requiresProbate(asset)).toBe(true);
    });

    it('Case 143: Rental property (income-producing)', () => {
        const asset: Asset = {
            id: '3',
            assetType: 'real_property',
            description: 'Rental property',
            value: 400000,
            ownershipType: 'INDIVIDUAL'
        };

        expect(requiresProbate(asset)).toBe(true);
    });

    it('Case 149: Property with mortgage', () => {
        const asset: Asset = {
            id: '4',
            assetType: 'real_property',
            description: 'Home with mortgage',
            value: 750000,
            ownershipType: 'INDIVIDUAL',
            hasLien: true
        };

        expect(asset.hasLien).toBe(true);
        expect(requiresProbate(asset)).toBe(true);
    });

    it('Case 157: Property held as joint tenants', () => {
        const asset: Asset = {
            id: '5',
            assetType: 'real_property',
            description: 'Joint tenancy property',
            value: 750000,
            ownershipType: 'JOINT'
        };

        expect(requiresProbate(asset)).toBe(false); // Right of survivorship
    });

    it('Case 158: Property held as tenants in common', () => {
        const asset: Asset = {
            id: '6',
            assetType: 'real_property',
            description: 'Tenants in common property',
            value: 750000,
            ownershipType: 'INDIVIDUAL' // Deceased's share
        };

        expect(requiresProbate(asset)).toBe(true); // No survivorship
    });

    it('Case 159: Property held as community property', () => {
        const asset: Asset = {
            id: '7',
            assetType: 'real_property',
            description: 'Community property',
            value: 750000,
            ownershipType: 'community'
        };

        expect(requiresProbate(asset)).toBe(false); // CPWROS
    });

    it('Case 160: Property in trust', () => {
        const asset: Asset = {
            id: '8',
            assetType: 'real_property',
            description: 'Trust property',
            value: 750000,
            ownershipType: 'TRUST'
        };

        expect(requiresProbate(asset)).toBe(false);
    });
});

describe('Golden Dataset: Financial Accounts (Cases 171-190)', () => {
    it('Case 171: Checking account (sole owner)', () => {
        const asset: Asset = {
            id: '9',
            assetType: 'financial',
            description: 'Checking account',
            value: 25000,
            ownershipType: 'INDIVIDUAL'
        };

        expect(requiresProbate(asset)).toBe(true);
    });

    it('Case 175: Joint checking account', () => {
        const asset: Asset = {
            id: '10',
            assetType: 'financial',
            description: 'Joint checking',
            value: 25000,
            ownershipType: 'JOINT'
        };

        expect(requiresProbate(asset)).toBe(false);
    });

    it('Case 177: Payable-on-death (POD) account', () => {
        const asset: Asset = {
            id: '11',
            assetType: 'financial',
            description: 'POD account',
            value: 50000,
            ownershipType: 'BENEFICIARY',
            hasBeneficiary: true,
            beneficiaryName: 'John Doe'
        };

        expect(requiresProbate(asset)).toBe(false);
    });

    it('Case 178: Transfer-on-death (TOD) account', () => {
        const asset: Asset = {
            id: '12',
            assetType: 'financial',
            description: 'TOD account',
            value: 100000,
            ownershipType: 'BENEFICIARY',
            hasBeneficiary: true,
            beneficiaryName: 'Jane Doe'
        };

        expect(requiresProbate(asset)).toBe(false);
    });

    it('Case 179: Account with beneficiary designation', () => {
        const asset: Asset = {
            id: '13',
            assetType: 'financial',
            description: 'Account with beneficiary',
            value: 75000,
            ownershipType: 'BENEFICIARY',
            hasBeneficiary: true,
            beneficiaryName: 'Spouse'
        };

        expect(requiresProbate(asset)).toBe(false);
    });

    it('Case 180: Account with no beneficiary', () => {
        const asset: Asset = {
            id: '14',
            assetType: 'financial',
            description: 'Account no beneficiary',
            value: 75000,
            ownershipType: 'INDIVIDUAL',
            hasBeneficiary: false
        };

        expect(requiresProbate(asset)).toBe(true);
    });
});

describe('Golden Dataset: Investment Accounts (Cases 191-220)', () => {
    it('Case 191: Individual brokerage account', () => {
        const asset: Asset = {
            id: '15',
            assetType: 'investment',
            description: 'Brokerage account',
            value: 250000,
            ownershipType: 'INDIVIDUAL'
        };

        expect(requiresProbate(asset)).toBe(true);
    });

    it('Case 193: IRA (traditional)', () => {
        const asset: Asset = {
            id: '16',
            assetType: 'investment',
            description: 'Traditional IRA',
            value: 500000,
            ownershipType: 'BENEFICIARY',
            hasBeneficiary: true,
            beneficiaryName: 'Spouse'
        };

        expect(requiresProbate(asset)).toBe(false);
    });

    it('Case 194: Roth IRA', () => {
        const asset: Asset = {
            id: '17',
            assetType: 'investment',
            description: 'Roth IRA',
            value: 300000,
            ownershipType: 'BENEFICIARY',
            hasBeneficiary: true,
            beneficiaryName: 'Children'
        };

        expect(requiresProbate(asset)).toBe(false);
    });

    it('Case 195: 401(k)', () => {
        const asset: Asset = {
            id: '18',
            assetType: 'investment',
            description: '401(k)',
            value: 750000,
            ownershipType: 'BENEFICIARY',
            hasBeneficiary: true,
            beneficiaryName: 'Spouse'
        };

        expect(requiresProbate(asset)).toBe(false);
    });

    it('Case 206: Cryptocurrency (Bitcoin, Ethereum)', () => {
        const asset: Asset = {
            id: '19',
            assetType: 'digital',
            description: 'Cryptocurrency',
            value: 50000,
            ownershipType: 'INDIVIDUAL'
        };

        expect(requiresProbate(asset)).toBe(true);
    });
});

describe('Golden Dataset: Estate Value Calculations', () => {
    it('Calculate total estate value', () => {
        const assets: Asset[] = [
            { id: '1', assetType: 'real_property', description: 'Home', value: 750000, ownershipType: 'INDIVIDUAL' },
            { id: '2', assetType: 'financial', description: 'Checking', value: 25000, ownershipType: 'INDIVIDUAL' },
            { id: '3', assetType: 'investment', description: 'IRA', value: 500000, ownershipType: 'BENEFICIARY', hasBeneficiary: true },
            { id: '4', assetType: 'personal', description: 'Vehicle', value: 30000, ownershipType: 'INDIVIDUAL' }
        ];

        const total = calculateEstateValue(assets);
        expect(total).toBe(1305000);
    });

    it('Identify probate vs non-probate assets', () => {
        const assets: Asset[] = [
            { id: '1', assetType: 'real_property', description: 'Home', value: 750000, ownershipType: 'INDIVIDUAL' },
            { id: '2', assetType: 'financial', description: 'Joint account', value: 25000, ownershipType: 'JOINT' },
            { id: '3', assetType: 'investment', description: 'IRA', value: 500000, ownershipType: 'BENEFICIARY', hasBeneficiary: true },
            { id: '4', assetType: 'real_property', description: 'Trust property', value: 400000, ownershipType: 'TRUST' }
        ];

        const probateAssets = getProbateAssets(assets);
        const nonProbateAssets = getNonProbateAssets(assets);

        expect(probateAssets.length).toBe(1); // Only the home
        expect(nonProbateAssets.length).toBe(3);
        expect(probateAssets[0].value).toBe(750000);
    });

    it('Calculate probate estate value', () => {
        const assets: Asset[] = [
            { id: '1', assetType: 'real_property', description: 'Home', value: 750000, ownershipType: 'INDIVIDUAL' },
            { id: '2', assetType: 'financial', description: 'Joint account', value: 25000, ownershipType: 'JOINT' },
            { id: '3', assetType: 'investment', description: 'IRA', value: 500000, ownershipType: 'BENEFICIARY', hasBeneficiary: true },
            { id: '4', assetType: 'personal', description: 'Vehicle', value: 30000, ownershipType: 'INDIVIDUAL' }
        ];

        const probateAssets = getProbateAssets(assets);
        const probateValue = calculateEstateValue(probateAssets);

        expect(probateValue).toBe(780000); // Home + Vehicle
    });

    it('Determine if small estate procedures apply', () => {
        const assets: Asset[] = [
            { id: '1', assetType: 'financial', description: 'Checking', value: 100000, ownershipType: 'INDIVIDUAL' },
            { id: '2', assetType: 'personal', description: 'Vehicle', value: 30000, ownershipType: 'INDIVIDUAL' },
            { id: '3', assetType: 'investment', description: 'IRA', value: 200000, ownershipType: 'BENEFICIARY', hasBeneficiary: true }
        ];

        const probateAssets = getProbateAssets(assets);
        const probateValue = calculateEstateValue(probateAssets);

        // CA small estate threshold is $184,500
        expect(probateValue).toBe(130000);
        expect(probateValue <= 184500).toBe(true); // Qualifies for small estate
    });
});
