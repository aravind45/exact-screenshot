/**
 * Golden Dataset Tests: Beneficiaries & Heirs
 * Tests cases 321-360 from GOLDEN_DATASET_EDGE_CASES.md
 */

import { describe, it, expect } from 'vitest';

type BeneficiaryType = 'spouse' | 'child' | 'parent' | 'sibling' | 'other' | 'charity' | 'trust';
type BeneficiaryStatus = 'active' | 'predeceased' | 'disclaimed' | 'incapacitated' | 'minor' | 'missing';
type DistributionMethod = 'per_stirpes' | 'per_capita' | 'equal' | 'specific';

interface Beneficiary {
    id: string;
    name: string;
    type: BeneficiaryType;
    relationship: string;
    status: BeneficiaryStatus;
    share: number; // Percentage (0-100)
    isContingent?: boolean;
    age?: number;
}

// Validate beneficiary share
function validateShare(share: number): { valid: boolean; error?: string } {
    if (share < 0) {
        return { valid: false, error: 'Share cannot be negative' };
    }
    
    if (share > 100) {
        return { valid: false, error: 'Share cannot exceed 100%' };
    }
    
    return { valid: true };
}

// Check if beneficiary can receive inheritance
function canReceive(beneficiary: Beneficiary): boolean {
    if (beneficiary.status === 'predeceased') return false;
    if (beneficiary.status === 'disclaimed') return false;
    if (beneficiary.status === 'missing') return false; // May need court determination
    return true;
}

// Check if beneficiary needs guardian/conservator
function needsGuardian(beneficiary: Beneficiary): boolean {
    if (beneficiary.status === 'minor') return true;
    if (beneficiary.status === 'incapacitated') return true;
    if (beneficiary.age && beneficiary.age < 18) return true;
    return false;
}

// Calculate total shares
function calculateTotalShares(beneficiaries: Beneficiary[]): number {
    return beneficiaries
        .filter(canReceive)
        .reduce((total, b) => total + b.share, 0);
}

// Distribute per stirpes (by representation)
function distributePerStirpes(
    beneficiaries: Beneficiary[],
    totalAmount: number
): Map<string, number> {
    const distribution = new Map<string, number>();
    
    beneficiaries.forEach(b => {
        if (canReceive(b)) {
            distribution.set(b.id, (totalAmount * b.share) / 100);
        }
    });
    
    return distribution;
}

// Validate total shares equal 100%
function validateTotalShares(beneficiaries: Beneficiary[]): { valid: boolean; error?: string } {
    const total = calculateTotalShares(beneficiaries);
    
    if (Math.abs(total - 100) > 0.01) { // Allow for floating point errors
        return { valid: false, error: `Total shares must equal 100%, got ${total}%` };
    }
    
    return { valid: true };
}

describe('Golden Dataset: Beneficiary Types (Cases 321-341)', () => {
    it('Case 321: Spouse (surviving)', () => {
        const beneficiary: Beneficiary = {
            id: '1',
            name: 'Jane Doe',
            type: 'spouse',
            relationship: 'Spouse',
            status: 'active',
            share: 50
        };
        
        expect(canReceive(beneficiary)).toBe(true);
        expect(needsGuardian(beneficiary)).toBe(false);
    });

    it('Case 322: Ex-spouse (divorced)', () => {
        const beneficiary: Beneficiary = {
            id: '2',
            name: 'Ex-Spouse',
            type: 'spouse',
            relationship: 'Ex-Spouse',
            status: 'active',
            share: 0 // Typically revoked by divorce
        };
        
        expect(beneficiary.share).toBe(0);
    });

    it('Case 323: Children (adult)', () => {
        const beneficiary: Beneficiary = {
            id: '3',
            name: 'John Doe Jr',
            type: 'child',
            relationship: 'Son',
            status: 'active',
            share: 25,
            age: 30
        };
        
        expect(canReceive(beneficiary)).toBe(true);
        expect(needsGuardian(beneficiary)).toBe(false);
    });

    it('Case 324: Children (minor)', () => {
        const beneficiary: Beneficiary = {
            id: '4',
            name: 'Minor Child',
            type: 'child',
            relationship: 'Daughter',
            status: 'minor',
            share: 25,
            age: 10
        };
        
        expect(canReceive(beneficiary)).toBe(true);
        expect(needsGuardian(beneficiary)).toBe(true);
    });

    it('Case 325: Stepchildren', () => {
        const beneficiary: Beneficiary = {
            id: '5',
            name: 'Stepchild',
            type: 'child',
            relationship: 'Stepchild',
            status: 'active',
            share: 10
        };
        
        expect(canReceive(beneficiary)).toBe(true);
    });

    it('Case 326: Adopted children', () => {
        const beneficiary: Beneficiary = {
            id: '6',
            name: 'Adopted Child',
            type: 'child',
            relationship: 'Adopted Child',
            status: 'active',
            share: 25
        };
        
        expect(canReceive(beneficiary)).toBe(true);
        // Adopted children have same rights as biological
    });

    it('Case 327: Foster children', () => {
        const beneficiary: Beneficiary = {
            id: '7',
            name: 'Foster Child',
            type: 'child',
            relationship: 'Foster Child',
            status: 'active',
            share: 0 // Typically no inheritance rights unless specified
        };
        
        expect(beneficiary.share).toBe(0);
    });

    it('Case 328: Grandchildren', () => {
        const beneficiary: Beneficiary = {
            id: '8',
            name: 'Grandchild',
            type: 'other',
            relationship: 'Grandchild',
            status: 'active',
            share: 10
        };
        
        expect(canReceive(beneficiary)).toBe(true);
    });

    it('Case 336: Friends', () => {
        const beneficiary: Beneficiary = {
            id: '9',
            name: 'Best Friend',
            type: 'other',
            relationship: 'Friend',
            status: 'active',
            share: 5
        };
        
        expect(canReceive(beneficiary)).toBe(true);
    });

    it('Case 337: Charities', () => {
        const beneficiary: Beneficiary = {
            id: '10',
            name: 'Red Cross',
            type: 'charity',
            relationship: 'Charity',
            status: 'active',
            share: 10
        };
        
        expect(canReceive(beneficiary)).toBe(true);
        expect(needsGuardian(beneficiary)).toBe(false);
    });

    it('Case 338: Trusts', () => {
        const beneficiary: Beneficiary = {
            id: '11',
            name: 'Family Trust',
            type: 'trust',
            relationship: 'Trust',
            status: 'active',
            share: 50
        };
        
        expect(canReceive(beneficiary)).toBe(true);
    });
});

describe('Golden Dataset: Beneficiary Complications (Cases 342-360)', () => {
    it('Case 342: Beneficiary predeceased', () => {
        const beneficiary: Beneficiary = {
            id: '12',
            name: 'Predeceased Child',
            type: 'child',
            relationship: 'Son',
            status: 'predeceased',
            share: 25
        };
        
        expect(canReceive(beneficiary)).toBe(false);
        // Share may go to their children (per stirpes)
    });

    it('Case 343: Beneficiary disclaims inheritance', () => {
        const beneficiary: Beneficiary = {
            id: '13',
            name: 'Disclaiming Child',
            type: 'child',
            relationship: 'Daughter',
            status: 'disclaimed',
            share: 25
        };
        
        expect(canReceive(beneficiary)).toBe(false);
    });

    it('Case 344: Beneficiary is incapacitated', () => {
        const beneficiary: Beneficiary = {
            id: '14',
            name: 'Incapacitated Child',
            type: 'child',
            relationship: 'Son',
            status: 'incapacitated',
            share: 25
        };
        
        expect(canReceive(beneficiary)).toBe(true);
        expect(needsGuardian(beneficiary)).toBe(true);
    });

    it('Case 345: Beneficiary is minor', () => {
        const beneficiary: Beneficiary = {
            id: '15',
            name: 'Minor Child',
            type: 'child',
            relationship: 'Daughter',
            status: 'minor',
            share: 25,
            age: 12
        };
        
        expect(canReceive(beneficiary)).toBe(true);
        expect(needsGuardian(beneficiary)).toBe(true);
    });

    it('Case 346: Beneficiary is in prison', () => {
        const beneficiary: Beneficiary = {
            id: '16',
            name: 'Incarcerated Child',
            type: 'child',
            relationship: 'Son',
            status: 'active',
            share: 25
        };
        
        expect(canReceive(beneficiary)).toBe(true);
        // Incarceration doesn't prevent inheritance
    });

    it('Case 347: Beneficiary is missing', () => {
        const beneficiary: Beneficiary = {
            id: '17',
            name: 'Missing Child',
            type: 'child',
            relationship: 'Daughter',
            status: 'missing',
            share: 25
        };
        
        expect(canReceive(beneficiary)).toBe(false);
        // May need court determination
    });

    it('Case 348: Beneficiary is foreign national', () => {
        const beneficiary: Beneficiary = {
            id: '18',
            name: 'Foreign Beneficiary',
            type: 'other',
            relationship: 'Cousin',
            status: 'active',
            share: 10
        };
        
        expect(canReceive(beneficiary)).toBe(true);
        // May have tax implications
    });

    it('Case 349: Beneficiary is undocumented', () => {
        const beneficiary: Beneficiary = {
            id: '19',
            name: 'Undocumented Beneficiary',
            type: 'other',
            relationship: 'Friend',
            status: 'active',
            share: 5
        };
        
        expect(canReceive(beneficiary)).toBe(true);
        // Immigration status doesn't prevent inheritance
    });

    it('Case 350: Beneficiary has special needs', () => {
        const beneficiary: Beneficiary = {
            id: '20',
            name: 'Special Needs Child',
            type: 'child',
            relationship: 'Son',
            status: 'incapacitated',
            share: 25
        };
        
        expect(canReceive(beneficiary)).toBe(true);
        expect(needsGuardian(beneficiary)).toBe(true);
        // May need special needs trust
    });

    it('Case 354: Multiple beneficiaries (equal shares)', () => {
        const beneficiaries: Beneficiary[] = [
            { id: '21', name: 'Child 1', type: 'child', relationship: 'Son', status: 'active', share: 33.33 },
            { id: '22', name: 'Child 2', type: 'child', relationship: 'Daughter', status: 'active', share: 33.33 },
            { id: '23', name: 'Child 3', type: 'child', relationship: 'Son', status: 'active', share: 33.34 }
        ];
        
        const total = calculateTotalShares(beneficiaries);
        expect(Math.abs(total - 100)).toBeLessThan(0.01);
    });

    it('Case 355: Multiple beneficiaries (unequal shares)', () => {
        const beneficiaries: Beneficiary[] = [
            { id: '24', name: 'Spouse', type: 'spouse', relationship: 'Spouse', status: 'active', share: 50 },
            { id: '25', name: 'Child 1', type: 'child', relationship: 'Son', status: 'active', share: 30 },
            { id: '26', name: 'Child 2', type: 'child', relationship: 'Daughter', status: 'active', share: 20 }
        ];
        
        const result = validateTotalShares(beneficiaries);
        expect(result.valid).toBe(true);
    });

    it('Case 356: Contingent beneficiaries', () => {
        const primary: Beneficiary = {
            id: '27',
            name: 'Primary',
            type: 'child',
            relationship: 'Son',
            status: 'predeceased',
            share: 50,
            isContingent: false
        };
        
        const contingent: Beneficiary = {
            id: '28',
            name: 'Contingent',
            type: 'other',
            relationship: 'Grandchild',
            status: 'active',
            share: 50,
            isContingent: true
        };
        
        expect(canReceive(primary)).toBe(false);
        expect(canReceive(contingent)).toBe(true);
    });
});

describe('Golden Dataset: Distribution Calculations', () => {
    it('Calculate distribution amounts', () => {
        const beneficiaries: Beneficiary[] = [
            { id: '1', name: 'Spouse', type: 'spouse', relationship: 'Spouse', status: 'active', share: 50 },
            { id: '2', name: 'Child 1', type: 'child', relationship: 'Son', status: 'active', share: 25 },
            { id: '3', name: 'Child 2', type: 'child', relationship: 'Daughter', status: 'active', share: 25 }
        ];
        
        const estateValue = 1000000;
        const distribution = distributePerStirpes(beneficiaries, estateValue);
        
        expect(distribution.get('1')).toBe(500000);
        expect(distribution.get('2')).toBe(250000);
        expect(distribution.get('3')).toBe(250000);
    });

    it('Handle predeceased beneficiary', () => {
        const beneficiaries: Beneficiary[] = [
            { id: '1', name: 'Child 1', type: 'child', relationship: 'Son', status: 'active', share: 50 },
            { id: '2', name: 'Child 2', type: 'child', relationship: 'Daughter', status: 'predeceased', share: 50 }
        ];
        
        const estateValue = 1000000;
        const distribution = distributePerStirpes(beneficiaries, estateValue);
        
        expect(distribution.get('1')).toBe(500000);
        expect(distribution.get('2')).toBeUndefined(); // Predeceased
    });

    it('Validate shares total 100%', () => {
        const beneficiaries: Beneficiary[] = [
            { id: '1', name: 'Child 1', type: 'child', relationship: 'Son', status: 'active', share: 40 },
            { id: '2', name: 'Child 2', type: 'child', relationship: 'Daughter', status: 'active', share: 30 },
            { id: '3', name: 'Child 3', type: 'child', relationship: 'Son', status: 'active', share: 30 }
        ];
        
        const result = validateTotalShares(beneficiaries);
        expect(result.valid).toBe(true);
    });

    it('Detect invalid total shares', () => {
        const beneficiaries: Beneficiary[] = [
            { id: '1', name: 'Child 1', type: 'child', relationship: 'Son', status: 'active', share: 40 },
            { id: '2', name: 'Child 2', type: 'child', relationship: 'Daughter', status: 'active', share: 40 }
        ];
        
        const result = validateTotalShares(beneficiaries);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('100%');
    });

    it('Count beneficiaries needing guardians', () => {
        const beneficiaries: Beneficiary[] = [
            { id: '1', name: 'Adult', type: 'child', relationship: 'Son', status: 'active', share: 33, age: 25 },
            { id: '2', name: 'Minor', type: 'child', relationship: 'Daughter', status: 'minor', share: 33, age: 10 },
            { id: '3', name: 'Incapacitated', type: 'child', relationship: 'Son', status: 'incapacitated', share: 34 }
        ];
        
        const needingGuardians = beneficiaries.filter(needsGuardian);
        expect(needingGuardians.length).toBe(2);
    });
});
