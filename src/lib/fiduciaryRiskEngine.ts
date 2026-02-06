/**
 * Fiduciary Risk Engine
 * 
 * This module detects and warns about actions that could
 * expose the executor to personal liability (surcharge risk).
 * 
 * LEGAL CONTEXT:
 * Executors/administrators are personally liable for:
 * - Paying debts before the creditor claim period closes
 * - Distributing assets before all debts are satisfied
 * - Acting without proper court authority
 * - Improper asset valuation or accounting
 * - Self-dealing or conflicts of interest
 */

import type { SettlementTrack } from '@/config/settlementStages';

export type RiskSeverity = 'INFO' | 'WARNING' | 'DANGER' | 'CRITICAL';

export interface FiduciaryRisk {
    id: string;
    title: string;
    description: string;
    severity: RiskSeverity;
    legalBasis?: string;
    recommendation: string;
    affectedActions: string[];
}

// Risk definitions for common executor mistakes
export const FIDUCIARY_RISKS: Record<string, FiduciaryRisk> = {
    PREMATURE_DEBT_PAYMENT: {
        id: 'PREMATURE_DEBT_PAYMENT',
        title: 'Premature Debt Payment',
        description: 'Paying debts before the creditor claim period closes (typically 4 months) may result in personal liability if preferred creditors appear later.',
        severity: 'DANGER',
        legalBasis: 'California Probate Code §9000-9399',
        recommendation: 'Wait until the 4-month creditor claim period ends before paying non-essential debts.',
        affectedActions: ['pay_debts', 'pay_other', 'pay_medical']
    },

    PREMATURE_DISTRIBUTION: {
        id: 'PREMATURE_DISTRIBUTION',
        title: 'Premature Asset Distribution',
        description: 'Distributing assets to heirs before all debts and taxes are paid may make you personally liable to creditors.',
        severity: 'CRITICAL',
        legalBasis: 'California Probate Code §11420-11429',
        recommendation: 'Ensure all debts are paid, tax clearance is obtained, and court approval is received before distribution.',
        affectedActions: ['distribute', 'distribute_funds', 'final_distribution']
    },

    NO_AUTHORITY_ACTION: {
        id: 'NO_AUTHORITY_ACTION',
        title: 'Acting Without Authority',
        description: 'Taking financial actions before Letters Testamentary are issued is illegal and may void the transactions.',
        severity: 'CRITICAL',
        legalBasis: 'California Probate Code §8400-8404',
        recommendation: 'Obtain certified Letters Testamentary before accessing accounts or making payments.',
        affectedActions: ['pay_debts', 'freeze_accounts', 'open_estate_account', 'collect_funds']
    },

    CREDITOR_PRIORITY_VIOLATION: {
        id: 'CREDITOR_PRIORITY_VIOLATION',
        title: 'Creditor Priority Violation',
        description: 'Paying creditors out of statutory priority order may create personal liability for unpaid senior creditors.',
        severity: 'DANGER',
        legalBasis: 'California Probate Code §11420',
        recommendation: 'Pay claims in statutory priority order: (1) Administration, (2) Funeral, (3) Medical, (4) Family Allowance, (5) General.',
        affectedActions: ['pay_debts', 'pay_claims']
    },

    MISSING_NOTICE: {
        id: 'MISSING_NOTICE',
        title: 'Failure to Give Notice',
        description: 'Not providing required notice to beneficiaries or creditors may invalidate court proceedings or distributions.',
        severity: 'WARNING',
        legalBasis: 'California Probate Code §16061.7, §9050',
        recommendation: 'Send all required notices via certified mail and retain proof of mailing.',
        affectedActions: ['distribute', 'final_petition']
    },

    BOND_REQUIREMENT: {
        id: 'BOND_REQUIREMENT',
        title: 'Bond Requirement Not Met',
        description: 'Some estates require a surety bond. Proceeding without proper bond may result in personal liability.',
        severity: 'WARNING',
        legalBasis: 'California Probate Code §8480-8488',
        recommendation: 'Confirm with the court whether bond is required and obtain waiver or purchase bond.',
        affectedActions: ['collect_funds', 'pay_debts']
    },

    SELF_DEALING: {
        id: 'SELF_DEALING',
        title: 'Conflict of Interest',
        description: 'Transactions benefiting the executor personally require court approval and full disclosure.',
        severity: 'DANGER',
        legalBasis: 'California Probate Code §9880-9885',
        recommendation: 'Disclose any conflicts to the court and obtain independent appraisals for related-party transactions.',
        affectedActions: ['purchase_asset', 'sell_to_executor']
    },

    INSOLVENT_ESTATE_DISTRIBUTION: {
        id: 'INSOLVENT_ESTATE_DISTRIBUTION',
        title: 'Insolvent Estate Distribution',
        description: 'Distributing assets when the estate cannot pay all debts creates personal liability for the shortfall.',
        severity: 'CRITICAL',
        legalBasis: 'California Probate Code §11640-11643',
        recommendation: 'File insolvency petition with the court before making any distributions.',
        affectedActions: ['distribute', 'distribute_funds']
    }
};

export interface RiskAssessment {
    action: string;
    risks: FiduciaryRisk[];
    canProceed: boolean;
    requiresConfirmation: boolean;
    blockedBy?: string;
}

export interface EstateRiskContext {
    track: SettlementTrack;
    hasAuthority: boolean;
    claimPeriodClosed: boolean;
    allDebtsAssessed: boolean;
    allDebtsPaid: boolean;
    isInsolvent: boolean;
    hasMinorBeneficiaries: boolean;
    bondObtained: boolean;
    completedTaskIds: string[];
}

/**
 * Assess fiduciary risks for a specific action
 */
export function assessActionRisks(
    actionId: string,
    context: EstateRiskContext
): RiskAssessment {
    const risks: FiduciaryRisk[] = [];
    let canProceed = true;
    let requiresConfirmation = false;
    let blockedBy: string | undefined;

    // Check for no-authority risk
    if (!context.hasAuthority && isFinancialAction(actionId)) {
        risks.push(FIDUCIARY_RISKS.NO_AUTHORITY_ACTION);
        canProceed = false;
        blockedBy = 'Letters Testamentary required';
    }

    // Check for premature debt payment
    if (isDebtPaymentAction(actionId) && !context.claimPeriodClosed) {
        risks.push(FIDUCIARY_RISKS.PREMATURE_DEBT_PAYMENT);
        requiresConfirmation = true;
    }

    // Check for premature distribution
    if (isDistributionAction(actionId)) {
        if (!context.claimPeriodClosed) {
            risks.push(FIDUCIARY_RISKS.PREMATURE_DISTRIBUTION);
            canProceed = false;
            blockedBy = 'Creditor claim period must close first';
        }

        if (!context.allDebtsPaid) {
            risks.push(FIDUCIARY_RISKS.PREMATURE_DISTRIBUTION);
            requiresConfirmation = true;
        }

        if (context.isInsolvent) {
            risks.push(FIDUCIARY_RISKS.INSOLVENT_ESTATE_DISTRIBUTION);
            canProceed = false;
            blockedBy = 'Insolvency must be declared to court first';
        }
    }

    // Check bond requirement
    if (isFinancialAction(actionId) && !context.bondObtained) {
        risks.push(FIDUCIARY_RISKS.BOND_REQUIREMENT);
        requiresConfirmation = true;
    }

    return {
        action: actionId,
        risks,
        canProceed,
        requiresConfirmation,
        blockedBy
    };
}

/**
 * Get all current risks for an estate
 */
export function getEstateRisks(context: EstateRiskContext): FiduciaryRisk[] {
    const risks: FiduciaryRisk[] = [];

    // Authority risk
    if (!context.hasAuthority) {
        risks.push(FIDUCIARY_RISKS.NO_AUTHORITY_ACTION);
    }

    // Timing risks
    if (!context.claimPeriodClosed) {
        risks.push(FIDUCIARY_RISKS.PREMATURE_DEBT_PAYMENT);
    }

    // Solvency risks
    if (context.isInsolvent) {
        risks.push(FIDUCIARY_RISKS.INSOLVENT_ESTATE_DISTRIBUTION);
    }

    // Bond risks
    if (!context.bondObtained) {
        risks.push(FIDUCIARY_RISKS.BOND_REQUIREMENT);
    }

    return risks;
}

/**
 * Get severity-appropriate styling for risk display
 */
export function getRiskSeverityStyle(severity: RiskSeverity): {
    bgColor: string;
    textColor: string;
    borderColor: string;
    icon: string;
} {
    switch (severity) {
        case 'CRITICAL':
            return {
                bgColor: 'bg-red-50',
                textColor: 'text-red-900',
                borderColor: 'border-red-200',
                icon: '🚨'
            };
        case 'DANGER':
            return {
                bgColor: 'bg-orange-50',
                textColor: 'text-orange-900',
                borderColor: 'border-orange-200',
                icon: '⚠️'
            };
        case 'WARNING':
            return {
                bgColor: 'bg-yellow-50',
                textColor: 'text-yellow-900',
                borderColor: 'border-yellow-200',
                icon: '⚡'
            };
        case 'INFO':
        default:
            return {
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-900',
                borderColor: 'border-blue-200',
                icon: 'ℹ️'
            };
    }
}

// Helper functions
function isFinancialAction(actionId: string): boolean {
    const financialActions = [
        'pay_debts', 'pay_funeral', 'pay_medical', 'pay_other',
        'freeze_accounts', 'open_estate_account', 'collect_funds',
        'notify_banks', 'transfer_funds'
    ];
    return financialActions.includes(actionId);
}

function isDebtPaymentAction(actionId: string): boolean {
    const debtActions = ['pay_debts', 'pay_funeral', 'pay_medical', 'pay_other', 'pay_claims'];
    return debtActions.includes(actionId);
}

function isDistributionAction(actionId: string): boolean {
    const distActions = ['distribute', 'distribute_funds', 'final_distribution', 'transfer_to_heirs'];
    return distActions.includes(actionId);
}
