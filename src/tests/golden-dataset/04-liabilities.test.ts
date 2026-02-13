/**
 * Golden Dataset Tests: Liabilities & Debts
 * Tests cases 281-320 from GOLDEN_DATASET_EDGE_CASES.md
 */

import { describe, it, expect } from 'vitest';

type DebtType = 'secured' | 'unsecured' | 'priority';
type DebtStatus = 'current' | 'delinquent' | 'collection' | 'judgment' | 'discharged';

interface Debt {
    id: string;
    type: DebtType;
    description: string;
    amount: number;
    creditor: string;
    status: DebtStatus;
    hasCoSigner?: boolean;
    hasLien?: boolean;
    isValid?: boolean;
}

// Validate debt amount
function validateDebtAmount(amount: number): { valid: boolean; error?: string } {
    if (amount < 0) {
        return { valid: false, error: 'Debt amount cannot be negative' };
    }
    
    if (amount > 1000000000) {
        return { valid: false, error: 'Debt amount unrealistically high' };
    }
    
    return { valid: true };
}

// Determine debt priority
function getDebtPriority(debt: Debt): number {
    // Priority order for estate settlement
    if (debt.type === 'secured' && debt.hasLien) return 1; // Secured debts first
    if (debt.description.includes('funeral')) return 2; // Funeral expenses
    if (debt.description.includes('tax')) return 3; // Tax debts
    if (debt.type === 'unsecured') return 4; // Unsecured debts last
    return 5;
}

// Check if debt is valid claim
function isValidClaim(debt: Debt): boolean {
    if (debt.status === 'discharged') return false; // Discharged in bankruptcy
    if (debt.isValid === false) return false; // Fraudulent or invalid
    return true;
}

// Calculate total liabilities
function calculateTotalLiabilities(debts: Debt[]): number {
    return debts
        .filter(isValidClaim)
        .reduce((total, debt) => total + debt.amount, 0);
}

// Determine if estate is solvent
function isSolvent(assets: number, liabilities: number): boolean {
    return assets >= liabilities;
}

describe('Golden Dataset: Secured Debts (Cases 281-290)', () => {
    it('Case 281: Mortgage (primary residence)', () => {
        const debt: Debt = {
            id: '1',
            type: 'secured',
            description: 'Mortgage',
            amount: 400000,
            creditor: 'Bank of America',
            status: 'current',
            hasLien: true
        };
        
        expect(validateDebtAmount(debt.amount).valid).toBe(true);
        expect(getDebtPriority(debt)).toBe(1);
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 282: Mortgage (second home)', () => {
        const debt: Debt = {
            id: '2',
            type: 'secured',
            description: 'Second mortgage',
            amount: 200000,
            creditor: 'Wells Fargo',
            status: 'current',
            hasLien: true
        };
        
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 283: Home equity loan', () => {
        const debt: Debt = {
            id: '3',
            type: 'secured',
            description: 'Home equity loan',
            amount: 50000,
            creditor: 'Chase',
            status: 'current',
            hasLien: true
        };
        
        expect(getDebtPriority(debt)).toBe(1);
    });

    it('Case 284: HELOC', () => {
        const debt: Debt = {
            id: '4',
            type: 'secured',
            description: 'HELOC',
            amount: 75000,
            creditor: 'Citibank',
            status: 'current',
            hasLien: true
        };
        
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 285: Auto loan', () => {
        const debt: Debt = {
            id: '5',
            type: 'secured',
            description: 'Auto loan',
            amount: 25000,
            creditor: 'Toyota Financial',
            status: 'current',
            hasLien: true
        };
        
        expect(validateDebtAmount(debt.amount).valid).toBe(true);
    });

    it('Case 286: Boat loan', () => {
        const debt: Debt = {
            id: '6',
            type: 'secured',
            description: 'Boat loan',
            amount: 50000,
            creditor: 'Marine Finance',
            status: 'current',
            hasLien: true
        };
        
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 287: RV loan', () => {
        const debt: Debt = {
            id: '7',
            type: 'secured',
            description: 'RV loan',
            amount: 80000,
            creditor: 'RV Finance Co',
            status: 'current',
            hasLien: true
        };
        
        expect(getDebtPriority(debt)).toBe(1);
    });

    it('Case 288: Business loan (secured)', () => {
        const debt: Debt = {
            id: '8',
            type: 'secured',
            description: 'Business loan',
            amount: 150000,
            creditor: 'Business Bank',
            status: 'current',
            hasLien: true
        };
        
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 289: Margin loan', () => {
        const debt: Debt = {
            id: '9',
            type: 'secured',
            description: 'Margin loan',
            amount: 100000,
            creditor: 'Fidelity',
            status: 'current',
            hasLien: true
        };
        
        expect(validateDebtAmount(debt.amount).valid).toBe(true);
    });

    it('Case 290: Pawn shop loan', () => {
        const debt: Debt = {
            id: '10',
            type: 'secured',
            description: 'Pawn loan',
            amount: 5000,
            creditor: 'Pawn Shop',
            status: 'current',
            hasLien: true
        };
        
        expect(isValidClaim(debt)).toBe(true);
    });
});

describe('Golden Dataset: Unsecured Debts (Cases 291-310)', () => {
    it('Case 291: Credit card debt', () => {
        const debt: Debt = {
            id: '11',
            type: 'unsecured',
            description: 'Credit card',
            amount: 15000,
            creditor: 'Visa',
            status: 'current'
        };
        
        expect(getDebtPriority(debt)).toBe(4);
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 292: Personal loan', () => {
        const debt: Debt = {
            id: '12',
            type: 'unsecured',
            description: 'Personal loan',
            amount: 20000,
            creditor: 'LendingClub',
            status: 'current'
        };
        
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 293: Medical bills', () => {
        const debt: Debt = {
            id: '13',
            type: 'unsecured',
            description: 'Medical bills',
            amount: 50000,
            creditor: 'Hospital',
            status: 'current'
        };
        
        expect(validateDebtAmount(debt.amount).valid).toBe(true);
    });

    it('Case 294: Student loans (federal)', () => {
        const debt: Debt = {
            id: '14',
            type: 'unsecured',
            description: 'Federal student loans',
            amount: 75000,
            creditor: 'Department of Education',
            status: 'current'
        };
        
        // Federal student loans may be discharged on death
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 295: Student loans (private)', () => {
        const debt: Debt = {
            id: '15',
            type: 'unsecured',
            description: 'Private student loans',
            amount: 50000,
            creditor: 'Sallie Mae',
            status: 'current'
        };
        
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 296: Payday loans', () => {
        const debt: Debt = {
            id: '16',
            type: 'unsecured',
            description: 'Payday loan',
            amount: 2000,
            creditor: 'Payday Lender',
            status: 'current'
        };
        
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 297: Tax debt (federal)', () => {
        const debt: Debt = {
            id: '17',
            type: 'priority',
            description: 'Federal tax debt',
            amount: 30000,
            creditor: 'IRS',
            status: 'current'
        };
        
        expect(getDebtPriority(debt)).toBe(3);
    });

    it('Case 298: Tax debt (state)', () => {
        const debt: Debt = {
            id: '18',
            type: 'priority',
            description: 'State tax debt',
            amount: 10000,
            creditor: 'California FTB',
            status: 'current'
        };
        
        expect(getDebtPriority(debt)).toBe(3);
    });

    it('Case 299: Tax debt (property)', () => {
        const debt: Debt = {
            id: '19',
            type: 'priority',
            description: 'Property tax debt',
            amount: 15000,
            creditor: 'County Tax Collector',
            status: 'delinquent'
        };
        
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 300: Utility bills', () => {
        const debt: Debt = {
            id: '20',
            type: 'unsecured',
            description: 'Utility bills',
            amount: 500,
            creditor: 'Electric Company',
            status: 'current'
        };
        
        expect(validateDebtAmount(debt.amount).valid).toBe(true);
    });
});

describe('Golden Dataset: Special Debt Situations (Cases 311-320)', () => {
    it('Case 311: Debt in collection', () => {
        const debt: Debt = {
            id: '21',
            type: 'unsecured',
            description: 'Credit card in collection',
            amount: 10000,
            creditor: 'Collection Agency',
            status: 'collection'
        };
        
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 312: Debt with co-signer', () => {
        const debt: Debt = {
            id: '22',
            type: 'unsecured',
            description: 'Personal loan with co-signer',
            amount: 25000,
            creditor: 'Bank',
            status: 'current',
            hasCoSigner: true
        };
        
        expect(debt.hasCoSigner).toBe(true);
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 313: Debt with guarantor', () => {
        const debt: Debt = {
            id: '23',
            type: 'unsecured',
            description: 'Business loan with guarantor',
            amount: 100000,
            creditor: 'Business Bank',
            status: 'current',
            hasCoSigner: true
        };
        
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 314: Debt in bankruptcy', () => {
        const debt: Debt = {
            id: '24',
            type: 'unsecured',
            description: 'Credit card',
            amount: 15000,
            creditor: 'Visa',
            status: 'discharged'
        };
        
        expect(isValidClaim(debt)).toBe(false); // Discharged
    });

    it('Case 315: Debt discharged in bankruptcy', () => {
        const debt: Debt = {
            id: '25',
            type: 'unsecured',
            description: 'Personal loan',
            amount: 20000,
            creditor: 'Bank',
            status: 'discharged'
        };
        
        expect(isValidClaim(debt)).toBe(false);
    });

    it('Case 316: Debt with judgment', () => {
        const debt: Debt = {
            id: '26',
            type: 'unsecured',
            description: 'Credit card with judgment',
            amount: 12000,
            creditor: 'Creditor',
            status: 'judgment'
        };
        
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 317: Debt with wage garnishment', () => {
        const debt: Debt = {
            id: '27',
            type: 'unsecured',
            description: 'Debt with garnishment',
            amount: 8000,
            creditor: 'Creditor',
            status: 'judgment'
        };
        
        expect(isValidClaim(debt)).toBe(true);
    });

    it('Case 318: Debt with lien', () => {
        const debt: Debt = {
            id: '28',
            type: 'secured',
            description: 'Debt with lien',
            amount: 50000,
            creditor: 'Creditor',
            status: 'current',
            hasLien: true
        };
        
        expect(getDebtPriority(debt)).toBe(1);
    });

    it('Case 319: Debt statute of limitations expired', () => {
        const debt: Debt = {
            id: '29',
            type: 'unsecured',
            description: 'Old credit card debt',
            amount: 5000,
            creditor: 'Old Creditor',
            status: 'collection',
            isValid: false // Statute expired
        };
        
        expect(isValidClaim(debt)).toBe(false);
    });

    it('Case 320: Fraudulent debt claims', () => {
        const debt: Debt = {
            id: '30',
            type: 'unsecured',
            description: 'Fraudulent claim',
            amount: 10000,
            creditor: 'Fake Creditor',
            status: 'collection',
            isValid: false
        };
        
        expect(isValidClaim(debt)).toBe(false);
    });
});

describe('Golden Dataset: Solvency Calculations', () => {
    it('Calculate total liabilities', () => {
        const debts: Debt[] = [
            { id: '1', type: 'secured', description: 'Mortgage', amount: 400000, creditor: 'Bank', status: 'current', hasLien: true },
            { id: '2', type: 'unsecured', description: 'Credit card', amount: 15000, creditor: 'Visa', status: 'current' },
            { id: '3', type: 'unsecured', description: 'Medical', amount: 50000, creditor: 'Hospital', status: 'current' },
            { id: '4', type: 'unsecured', description: 'Discharged', amount: 20000, creditor: 'Bank', status: 'discharged' }
        ];
        
        const total = calculateTotalLiabilities(debts);
        expect(total).toBe(465000); // Excludes discharged debt
    });

    it('Determine if estate is solvent', () => {
        const assets = 1000000;
        const liabilities = 500000;
        
        expect(isSolvent(assets, liabilities)).toBe(true);
    });

    it('Determine if estate is insolvent', () => {
        const assets = 300000;
        const liabilities = 500000;
        
        expect(isSolvent(assets, liabilities)).toBe(false);
    });

    it('Calculate net estate value', () => {
        const assets = 1000000;
        const debts: Debt[] = [
            { id: '1', type: 'secured', description: 'Mortgage', amount: 400000, creditor: 'Bank', status: 'current', hasLien: true },
            { id: '2', type: 'unsecured', description: 'Credit card', amount: 15000, creditor: 'Visa', status: 'current' }
        ];
        
        const liabilities = calculateTotalLiabilities(debts);
        const netValue = assets - liabilities;
        
        expect(netValue).toBe(585000);
    });

    it('Priority order for debt payment', () => {
        const debts: Debt[] = [
            { id: '1', type: 'unsecured', description: 'Credit card', amount: 15000, creditor: 'Visa', status: 'current' },
            { id: '2', type: 'secured', description: 'Mortgage', amount: 400000, creditor: 'Bank', status: 'current', hasLien: true },
            { id: '3', type: 'priority', description: 'Tax debt', amount: 30000, creditor: 'IRS', status: 'current' },
            { id: '4', type: 'unsecured', description: 'Funeral expenses', amount: 10000, creditor: 'Funeral Home', status: 'current' }
        ];
        
        const sorted = debts.sort((a, b) => getDebtPriority(a) - getDebtPriority(b));
        
        expect(sorted[0].description).toBe('Mortgage'); // Secured first
        expect(sorted[1].description).toBe('Funeral expenses'); // Funeral second
        expect(sorted[2].description).toBe('Tax debt'); // Tax third
        expect(sorted[3].description).toBe('Credit card'); // Unsecured last
    });
});
