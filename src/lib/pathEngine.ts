import { calculateAuthorityRecommendation } from './authorityEngine.js';
import type { AuthorityRecommendation } from './authorityEngine.js';

export interface PathResult {
    pathId: string;
    pathLabel: string;
    complexity: 'Simple' | 'Medium' | 'Complex';
    timeline: string;
    confidence: number;
    modifiers: string[];
    nextSteps: string[];
}

export interface UserAnswers {
    hasWill: 'yes' | 'no' | 'not_sure';
    hasTrust: 'yes' | 'no' | 'not_sure';
    trustType?: 'revocable' | 'irrevocable' | 'none' | 'not_sure';
    hasTODDeed: 'yes' | 'no' | 'not_sure';
    hasContest: 'yes' | 'no' | 'not_sure';
    isOutOfState: 'yes' | 'no' | 'not_sure';
    isSpouse: 'yes' | 'no' | 'not_sure';
    debtStatus: 'solvent' | 'insolvent' | 'not_sure';
}

// Conservative defaults for "not_sure" values
const DEFAULTS = {
    hasWill: 'no', // Intestate - conservative
    hasTrust: 'no',
    trustType: 'none',
    hasTODDeed: 'no',
    hasContest: 'no', // Prevents false alarm
    isOutOfState: 'no',
    isSpouse: 'no',
    debtStatus: 'solvent'
};

export function determinePath(answers: UserAnswers, state: string): PathResult {
    // Apply conservative defaults for "not_sure" values
    const resolvedAnswers = {
        hasWill: answers.hasWill === 'not_sure' ? DEFAULTS.hasWill === 'yes' : answers.hasWill === 'yes',
        hasTrust: answers.hasTrust === 'not_sure' ? DEFAULTS.hasTrust === 'yes' : answers.hasTrust === 'yes',
        isTrustRevocable: answers.trustType === 'not_sure' ? undefined : 
                           answers.trustType === 'revocable' ? true :
                           answers.trustType === 'irrevocable' ? false : undefined,
        hasTODDeed: answers.hasTODDeed === 'not_sure' ? DEFAULTS.hasTODDeed === 'yes' : answers.hasTODDeed === 'yes',
        hasContest: answers.hasContest === 'not_sure' ? DEFAULTS.hasContest === 'yes' : answers.hasContest === 'yes',
        isOutOfState: answers.isOutOfState === 'not_sure' ? DEFAULTS.isOutOfState === 'yes' : answers.isOutOfState === 'yes',
        isSpouse: answers.isSpouse === 'not_sure' ? DEFAULTS.isSpouse === 'yes' : answers.isSpouse === 'yes',
        hasInsolvencyRisk: answers.debtStatus === 'not_sure' ? false : answers.debtStatus === 'insolvent'
    };

    // Calculate path using existing authority engine
    const recommendation = calculateAuthorityRecommendation([], state, {
        hasWill: resolvedAnswers.hasWill,
        isTrustRevocable: resolvedAnswers.isTrustRevocable,
        hasTODDeed: resolvedAnswers.hasTODDeed,
        hasContest: resolvedAnswers.hasContest,
        isOutOfState: resolvedAnswers.isOutOfState,
        isSpouse: resolvedAnswers.isSpouse,
        hasInsolvencyRisk: resolvedAnswers.hasInsolvencyRisk
    });

    // Calculate confidence based on confirmed answers
    const confirmedFields = Object.values(answers).filter(value => value !== 'not_sure').length;
    const confidence = Math.round((confirmedFields / Object.keys(answers).length) * 100);

    // Map complexity
    const complexity = mapComplexity(recommendation.type);
    
    // Map timeline
    const timeline = mapTimeline(recommendation.type);
    
    // Extract modifiers
    const modifiers = recommendation.modifiers || [];
    
    // Generate next steps
    const nextSteps = generateNextSteps(recommendation.type, state);

    return {
        pathId: recommendation.type,
        pathLabel: recommendation.procedureType.replace(/_/g, ' '),
        complexity,
        timeline,
        confidence,
        modifiers,
        nextSteps
    };
}

function mapComplexity(pathType: string): 'Simple' | 'Medium' | 'Complex' {
    switch (pathType) {
        case 'SMALL_ESTATE':
            return 'Simple';
        case 'TRUST_ADMIN_REVOCABLE':
        case 'TRUST_ADMIN_IRREVOCABLE':
        case 'INFORMAL_PROBATE':
        case 'FORMAL_PROBATE':
        case 'INTESTATE':
            return 'Medium';
        case 'CONTESTED_ESTATE':
        case 'INSOLVENT_ESTATE':
        case 'ANCILLARY_PROBATE':
            return 'Complex';
        default:
            return 'Medium';
    }
}

function mapTimeline(pathType: string): string {
    switch (pathType) {
        case 'SMALL_ESTATE':
            return '2–6 months';
        case 'TRUST_ADMIN_REVOCABLE':
            return '2–6 months';
        case 'TRUST_ADMIN_IRREVOCABLE':
            return '3–9 months';
        case 'INFORMAL_PROBATE':
        case 'FORMAL_PROBATE':
            return '6–12 months';
        case 'INTESTATE':
            return '8–18 months';
        case 'CONTESTED_ESTATE':
            return '12–24+ months';
        case 'INSOLVENT_ESTATE':
            return '6–18+ months';
        case 'ANCILLARY_PROBATE':
            return '9–18 months';
        default:
            return '6–12 months';
    }
}

function generateNextSteps(pathType: string, state: string): string[] {
    switch (pathType) {
        case 'SMALL_ESTATE':
            return [
                'Wait 40 days (CA) or required waiting period',
                'Prepare and notarize Small Estate Affidavit',
                'Submit affidavit to institutions with death certificate'
            ];
        case 'TRUST_ADMIN_REVOCABLE':
            return [
                'Locate and review trust document',
                'Notify beneficiaries of trust administration',
                'Inventory trust assets and begin distribution'
            ];
        case 'TRUST_ADMIN_IRREVOCABLE':
            return [
                'Review trust terms and trustee powers',
                'Notify beneficiaries and obtain consents if required',
                'Manage trust assets according to trust terms'
            ];
        case 'INFORMAL_PROBATE':
            return [
                'File petition for informal probate with court',
                'Obtain Letters Testamentary',
                'Begin asset collection and creditor notification'
            ];
        case 'FORMAL_PROBATE':
            return [
                'File petition for formal probate',
                'Attend court hearing for appointment',
                'Obtain Letters Testamentary and begin administration'
            ];
        case 'INTESTATE':
            return [
                    'File petition for letters of administration',
                'Court will appoint administrator',
                'Follow state intestacy laws for distribution'
            ];
        case 'CONTESTED_ESTATE':
            return [
                'File petition for probate with notice of contest',
                'Prepare for litigation and discovery',
                'Attend court hearings as scheduled'
            ];
        case 'INSOLVENT_ESTATE':
            return [
                'File petition for insolvency proceedings',
                'Prioritize creditor payments by statutory order',
                'Distribute remaining assets to heirs if any'
            ];
        case 'ANCILLARY_PROBATE':
            return [
                'File ancillary probate petition in out-of-state jurisdiction',
                'Obtain ancillary letters testamentary',
                'Handle out-of-state asset transfer'
            ];
        default:
            return [
                'Consult with probate attorney',
                'Gather required documents',
                'Begin appropriate legal proceedings'
            ];
    }
}