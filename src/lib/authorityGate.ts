/**
 * Authority Gate System
 * 
 * This module implements legal safeguards to prevent executors from taking
 * financial actions before proper court authority is established.
 * 
 * LEGAL CONTEXT:
 * Until Letters Testamentary (DE-150) or equivalent are issued by the court,
 * the executor has NO legal authority to:
 * - Access or freeze bank accounts
 * - Pay debts or bills
 * - Open estate bank accounts
 * - Transfer or sell assets
 * 
 * Acting without authority creates personal liability (surcharge risk).
 */

import type { SettlementTrack } from '@/config/settlementStages';

// Authority states in order of progression
export type AuthorityState =
    | 'PENDING'      // No petition filed yet
    | 'FILED'        // Petition submitted, awaiting hearing
    | 'GRANTED'      // Letters issued by court
    | 'ACTIVE';      // Fully authorized and operating

// Action categories that require different levels of authority
export type ActionCategory =
    | 'IDENTIFICATION'     // Asset discovery, creating lists - no authority needed
    | 'NOTIFICATION'       // Sending notices to heirs/creditors - minimal authority
    | 'FINANCIAL'          // Bank access, payments - requires GRANTED authority
    | 'DISTRIBUTION'       // Asset distribution to heirs - requires full authorization
    | 'COURT_FILING';      // Filing documents with court - varies by type

// Map of actions to their required authority level
export const ACTION_AUTHORITY_REQUIREMENTS: Record<string, {
    category: ActionCategory;
    minAuthority: AuthorityState;
    warning?: string;
}> = {
    // Pre-authority actions (safe before Letters)
    'list_assets': { category: 'IDENTIFICATION', minAuthority: 'PENDING' },
    'preliminary_inventory': { category: 'IDENTIFICATION', minAuthority: 'PENDING' },
    'estimate_value': { category: 'IDENTIFICATION', minAuthority: 'PENDING' },
    'identify_jurisdiction': { category: 'IDENTIFICATION', minAuthority: 'PENDING' },
    'determine_bond': { category: 'IDENTIFICATION', minAuthority: 'PENDING' },
    'review_trust': { category: 'IDENTIFICATION', minAuthority: 'PENDING' },
    'identify_beneficiaries': { category: 'IDENTIFICATION', minAuthority: 'PENDING' },

    // Court filing actions (can file before authority)
    'file_petition': { category: 'COURT_FILING', minAuthority: 'PENDING' },
    'lodge_will': { category: 'COURT_FILING', minAuthority: 'PENDING' },
    'publish_notice': { category: 'COURT_FILING', minAuthority: 'FILED' },
    'mail_notice': { category: 'COURT_FILING', minAuthority: 'FILED' },

    // Authority milestone
    'attend_hearing': { category: 'COURT_FILING', minAuthority: 'FILED' },
    'bond': { category: 'COURT_FILING', minAuthority: 'FILED' },
    'letters': { category: 'COURT_FILING', minAuthority: 'FILED' },
    'ein': { category: 'FINANCIAL', minAuthority: 'GRANTED' },

    // Financial actions (REQUIRE Letters Testamentary)
    'notify_banks': {
        category: 'FINANCIAL',
        minAuthority: 'GRANTED',
        warning: 'Banks will require certified Letters Testamentary before providing access.'
    },
    'freeze_accounts': {
        category: 'FINANCIAL',
        minAuthority: 'GRANTED',
        warning: 'Cannot freeze accounts without court-issued authority.'
    },
    'open_estate_account': {
        category: 'FINANCIAL',
        minAuthority: 'GRANTED',
        warning: 'Banks require Letters Testamentary to open estate accounts.'
    },
    'pay_debts': {
        category: 'FINANCIAL',
        minAuthority: 'GRANTED',
        warning: 'Paying debts without authority may create personal liability.'
    },
    'pay_funeral': {
        category: 'FINANCIAL',
        minAuthority: 'GRANTED',
        warning: 'Personal funds may be reimbursed later, but estate funds require authority.'
    },
    'collect_funds': {
        category: 'FINANCIAL',
        minAuthority: 'GRANTED',
        warning: 'Institutions require certified authority documents.'
    },

    // Distribution actions (REQUIRE full authority + claim period closed)
    'distribute': {
        category: 'DISTRIBUTION',
        minAuthority: 'ACTIVE',
        warning: 'Distribution before creditor claim period may create personal liability.'
    },
    'distribute_funds': {
        category: 'DISTRIBUTION',
        minAuthority: 'ACTIVE',
        warning: 'Ensure all debts are paid before distribution.'
    },
    'final_petition': {
        category: 'DISTRIBUTION',
        minAuthority: 'GRANTED'
    },
};

// Track-specific authority requirements
export const TRACK_AUTHORITY_MODEL: Record<SettlementTrack, {
    requiresCourtAuthority: boolean;
    authorityDocument: string;
    authorityMilestone: string;
}> = {
    FORMAL_PROBATE: {
        requiresCourtAuthority: true,
        authorityDocument: 'Letters Testamentary (DE-150)',
        authorityMilestone: 'letters'
    },
    INFORMAL_PROBATE: {
        requiresCourtAuthority: true,
        authorityDocument: 'Letters Testamentary',
        authorityMilestone: 'letters'
    },
    INTESTATE: {
        requiresCourtAuthority: true,
        authorityDocument: 'Letters of Administration',
        authorityMilestone: 'letters'
    },
    SMALL_ESTATE: {
        requiresCourtAuthority: false,
        authorityDocument: 'Small Estate Affidavit',
        authorityMilestone: 'notarize'
    },
    TRUST_ADMIN: {
        requiresCourtAuthority: false,
        authorityDocument: 'Certificate of Trust',
        authorityMilestone: 'notarize_cert'
    },
    JOINT_TRANSFER: {
        requiresCourtAuthority: false,
        authorityDocument: 'Death Certificate + Ownership Docs',
        authorityMilestone: 'gather_docs'
    },
    POD_TOD_TRANSFER: {
        requiresCourtAuthority: false,
        authorityDocument: 'Death Certificate + Beneficiary Claim',
        authorityMilestone: 'file_claim'
    },
    SPOUSAL_PETITION: {
        requiresCourtAuthority: true,
        authorityDocument: 'Court Order (DE-226)',
        authorityMilestone: 'court_order'
    },
    ANCILLARY_PROBATE: {
        requiresCourtAuthority: true,
        authorityDocument: 'Ancillary Letters',
        authorityMilestone: 'ancillary_letters'
    },
    INSOLVENT: {
        requiresCourtAuthority: true,
        authorityDocument: 'Letters + Insolvency Declaration',
        authorityMilestone: 'declare_insolvency'
    },
    SPECIAL: {
        requiresCourtAuthority: true,
        authorityDocument: 'Special Administration Letters',
        authorityMilestone: 'special_letters'
    },
    DISCOVERY: {
        requiresCourtAuthority: false,
        authorityDocument: 'None (Discovery Phase)',
        authorityMilestone: 'complete_discovery'
    }
};

export interface AuthorityStatus {
    state: AuthorityState;
    track: SettlementTrack;
    authorityDocument: string;
    authorityMilestone: string;
    authorityGrantedAt?: Date;
    lettersExpirationDate?: Date;
    requiresCourtAuthority: boolean;
}

export interface ActionGateResult {
    allowed: boolean;
    reason?: string;
    requiredAuthority?: AuthorityState;
    currentAuthority: AuthorityState;
    prerequisiteTask?: string;
    warning?: string;
}

/**
 * Determine the current authority state based on completed tasks
 */
export function getAuthorityState(
    track: SettlementTrack,
    completedTaskIds: string[]
): AuthorityState {
    const trackModel = TRACK_AUTHORITY_MODEL[track];

    if (!trackModel) {
        return 'PENDING';
    }

    // Check if authority milestone is completed
    if (completedTaskIds.includes(trackModel.authorityMilestone)) {
        return 'ACTIVE';
    }

    // Check if we're past filing but before authority
    const filingTasks = ['file_petition', 'lodge_will', 'prepare_affidavit'];
    const hasFiledPetition = filingTasks.some(t => completedTaskIds.includes(t));

    if (hasFiledPetition) {
        return 'FILED';
    }

    // Check if hearing is complete but letters not yet obtained
    if (completedTaskIds.includes('attend_hearing') && !completedTaskIds.includes('letters')) {
        return 'GRANTED';
    }

    return 'PENDING';
}

/**
 * Get full authority status for an estate
 */
export function getAuthorityStatus(
    track: SettlementTrack,
    completedTaskIds: string[],
    authorityGrantedAt?: Date
): AuthorityStatus {
    const trackModel = TRACK_AUTHORITY_MODEL[track];
    const state = getAuthorityState(track, completedTaskIds);

    return {
        state,
        track,
        authorityDocument: trackModel?.authorityDocument || 'Unknown',
        authorityMilestone: trackModel?.authorityMilestone || 'unknown',
        authorityGrantedAt,
        requiresCourtAuthority: trackModel?.requiresCourtAuthority ?? true
    };
}

/**
 * Check if a specific action can be performed given current authority
 */
export function canPerformAction(
    actionId: string,
    track: SettlementTrack,
    completedTaskIds: string[]
): ActionGateResult {
    const currentAuthority = getAuthorityState(track, completedTaskIds);
    const actionReq = ACTION_AUTHORITY_REQUIREMENTS[actionId];
    const trackModel = TRACK_AUTHORITY_MODEL[track];

    // If action not in requirements, allow it (assume safe)
    if (!actionReq) {
        return {
            allowed: true,
            currentAuthority
        };
    }

    // For non-court tracks, most actions are allowed
    if (!trackModel?.requiresCourtAuthority && actionReq.category !== 'DISTRIBUTION') {
        return {
            allowed: true,
            currentAuthority,
            warning: actionReq.warning
        };
    }

    // Check authority level
    const authorityOrder: AuthorityState[] = ['PENDING', 'FILED', 'GRANTED', 'ACTIVE'];
    const currentLevel = authorityOrder.indexOf(currentAuthority);
    const requiredLevel = authorityOrder.indexOf(actionReq.minAuthority);

    if (currentLevel >= requiredLevel) {
        return {
            allowed: true,
            currentAuthority,
            warning: actionReq.warning
        };
    }

    // Action is blocked
    return {
        allowed: false,
        reason: getBlockedReason(actionId, currentAuthority, actionReq.minAuthority, trackModel),
        requiredAuthority: actionReq.minAuthority,
        currentAuthority,
        prerequisiteTask: trackModel?.authorityMilestone,
        warning: actionReq.warning
    };
}

/**
 * Get user-friendly explanation for why an action is blocked
 */
function getBlockedReason(
    actionId: string,
    current: AuthorityState,
    required: AuthorityState,
    trackModel?: { authorityDocument: string; authorityMilestone: string }
): string {
    if (current === 'PENDING' && required !== 'PENDING') {
        return `This action requires court authority. Please file the petition first.`;
    }

    if (current === 'FILED' && (required === 'GRANTED' || required === 'ACTIVE')) {
        return `This action requires ${trackModel?.authorityDocument || 'Letters Testamentary'}. ` +
            `Complete "${trackModel?.authorityMilestone || 'Obtain Certified Letters'}" first.`;
    }

    if (required === 'ACTIVE') {
        return `This action requires full authorization and the creditor claim period to be closed.`;
    }

    return `This action requires ${required} authority level. Current status: ${current}.`;
}

/**
 * Get all blocked actions for current authority state
 */
export function getBlockedActions(
    track: SettlementTrack,
    completedTaskIds: string[]
): string[] {
    const blocked: string[] = [];

    for (const actionId of Object.keys(ACTION_AUTHORITY_REQUIREMENTS)) {
        const result = canPerformAction(actionId, track, completedTaskIds);
        if (!result.allowed) {
            blocked.push(actionId);
        }
    }

    return blocked;
}

/**
 * Check if estate has reached the authority milestone
 */
export function hasAuthority(
    track: SettlementTrack,
    completedTaskIds: string[]
): boolean {
    const state = getAuthorityState(track, completedTaskIds);
    return state === 'GRANTED' || state === 'ACTIVE';
}

/**
 * Get the next required step to gain authority
 */
export function getNextAuthorityStep(
    track: SettlementTrack,
    completedTaskIds: string[]
): { taskId: string; description: string } | null {
    const state = getAuthorityState(track, completedTaskIds);
    const trackModel = TRACK_AUTHORITY_MODEL[track];

    if (state === 'ACTIVE' || state === 'GRANTED') {
        return null; // Already have authority
    }

    if (state === 'PENDING') {
        return {
            taskId: 'file_petition',
            description: 'File the petition with the probate court'
        };
    }

    if (state === 'FILED') {
        return {
            taskId: trackModel?.authorityMilestone || 'letters',
            description: `Obtain ${trackModel?.authorityDocument || 'Letters Testamentary'}`
        };
    }

    return null;
}
