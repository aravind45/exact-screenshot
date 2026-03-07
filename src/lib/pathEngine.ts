import { calculateAuthorityRecommendation } from './authorityEngine.js';
import type { AuthorityRecommendation } from './authorityEngine.js';

export interface PathResult {
    pathId: string;
    pathLabel: string;
    xlsxOutcome: string;       // Exact name from Estate_Path_Combinations_All_50_States.xlsx
    complexity: 'Simple' | 'Medium' | 'Complex';
    timeline: string;
    confidence: number;
    modifiers: string[];
    nextSteps: string[];
    warningFlags: string[];    // Legal risk flags shown prominently in UI
}

export interface UserAnswers {
    hasWill: 'yes' | 'no' | 'not_sure';
    hasTrust: 'yes' | 'no' | 'not_sure';
    trustType?: 'revocable' | 'irrevocable' | 'none' | 'not_sure';
    hasTODDeed: 'yes' | 'no' | 'not_sure';
    hasContest: 'yes' | 'no' | 'not_sure';
    isSpouse: 'yes' | 'no' | 'not_sure';      // Surviving Spouse — XLSX dimension
    isOutOfState: 'yes' | 'no' | 'not_sure';
    debtStatus: 'solvent' | 'insolvent' | 'not_sure';  // Debt Status — XLSX dimension
}

// Conservative defaults for "not_sure" values
// These are designed to never under-state complexity — always assume the simpler/safer path
// if genuinely unknown, and escalate if facts change.
const DEFAULTS = {
    hasWill: 'no',          // Assume intestate when unknown — conservative
    hasTrust: 'no',
    trustType: 'none',
    hasTODDeed: 'no',
    hasContest: 'no',       // Prevents false contest alarm
    isSpouse: 'no',         // Assume no surviving spouse when unknown
    isOutOfState: 'no',     // Assume all assets in-state
    debtStatus: 'solvent'   // Assume solvent; insolvency will surface via liability entry
};

/**
 * Maps the 7 XLSX outcome strings to internal AuthorityType codes.
 * Estate_Path_Combinations_All_50_States.xlsx → Primary Path Outcome
 */
const XLSX_OUTCOME_LABELS: Record<string, string> = {
    'INSOLVENT_ESTATE':       'Insolvent Estate Administration',
    'TRUST_ADMIN_REVOCABLE':  'Trust Administration (Revocable Living Trust)',
    'TRUST_ADMIN_IRREVOCABLE':'Irrevocable Trust Administration',
    'CONTESTED_ESTATE':       'Contested Probate Litigation',
    'ANCILLARY_PROBATE':      'Ancillary Probate Required',
    'INTESTATE':              'Intestate Probate',
    'FORMAL_PROBATE':         'General Probate Administration',
    'INFORMAL_PROBATE':       'General Probate Administration',  // UPC states: informal = general
    'SMALL_ESTATE':           'General Probate Administration',  // Small estate affidavit
    'SPOUSAL_PETITION':       'General Probate Administration',  // Spousal petition variant
    'MUNIMENT_OF_TITLE':      'General Probate Administration',  // TX muniment
};

export function determinePath(answers: UserAnswers, state: string): PathResult {
    // Apply conservative defaults for "not_sure" values
    const resolvedAnswers = {
        hasWill: answers.hasWill === 'not_sure'
            ? DEFAULTS.hasWill === 'yes'
            : answers.hasWill === 'yes',
        // Trust: only active if explicitly 'yes'
        hasTrust: answers.hasTrust === 'yes',
        isTrustRevocable: answers.hasTrust !== 'yes'
            ? undefined
            : answers.trustType === 'revocable'
                ? true
                : answers.trustType === 'irrevocable'
                    ? false
                    : undefined, // not_sure → engine defaults to revocable
        hasTODDeed: answers.hasTODDeed === 'not_sure'
            ? DEFAULTS.hasTODDeed === 'yes'
            : answers.hasTODDeed === 'yes',
        hasContest: answers.hasContest === 'not_sure'
            ? DEFAULTS.hasContest === 'yes'
            : answers.hasContest === 'yes',
        isOutOfState: answers.isOutOfState === 'not_sure'
            ? DEFAULTS.isOutOfState === 'yes'
            : answers.isOutOfState === 'yes',
        isSpouse: answers.isSpouse === 'not_sure'
            ? DEFAULTS.isSpouse === 'yes'
            : answers.isSpouse === 'yes',
        hasInsolvencyRisk: answers.debtStatus === 'not_sure'
            ? false
            : answers.debtStatus === 'insolvent',
    };

    // Build pseudo-assets array to pass trust type to engine
    // The engine uses trustAssets.length > 0 to activate TRUST engine
    const pseudoAssets = resolvedAnswers.hasTrust
        ? [{ ownershipType: 'TRUST', value: 1, inTrust: true }]
        : [];

    const recommendation = calculateAuthorityRecommendation(pseudoAssets, state, {
        hasWill: resolvedAnswers.hasWill,
        isTrustRevocable: resolvedAnswers.isTrustRevocable,
        hasTODDeed: resolvedAnswers.hasTODDeed,
        hasContest: resolvedAnswers.hasContest,
        isOutOfState: resolvedAnswers.isOutOfState,
        isSpouse: resolvedAnswers.isSpouse,
        hasInsolvencyRisk: resolvedAnswers.hasInsolvencyRisk,
    });

    // Calculate confidence based on confirmed (non-not_sure) answers
    const totalFields = Object.keys(answers).length;
    const confirmedFields = Object.entries(answers).filter(([, v]) => v !== 'not_sure').length;
    const confidence = Math.round((confirmedFields / totalFields) * 100);

    const complexity = mapComplexity(recommendation.type, resolvedAnswers);
    const timeline = mapTimeline(recommendation.type);
    const xlsxOutcome = XLSX_OUTCOME_LABELS[recommendation.type] || 'General Probate Administration';
    const modifiers = recommendation.modifiers || [];
    const nextSteps = generateNextSteps(recommendation.type, state, resolvedAnswers);
    const warningFlags = generateWarningFlags(resolvedAnswers);

    return {
        pathId: recommendation.type,
        pathLabel: xlsxOutcome,
        xlsxOutcome,
        complexity,
        timeline,
        confidence,
        modifiers,
        nextSteps,
        warningFlags,
    };
}

/**
 * Map path type to complexity.
 * Aligned with Estate_Path_Combinations_All_50_States.xlsx Complexity column.
 */
function mapComplexity(
    pathType: string,
    _resolved: { hasInsolvencyRisk: boolean; hasContest: boolean; isOutOfState: boolean }
): 'Simple' | 'Medium' | 'Complex' {
    switch (pathType) {
        case 'SMALL_ESTATE':
            return 'Simple';

        case 'TRUST_ADMIN_REVOCABLE':
        case 'TRUST_ADMIN_IRREVOCABLE':
            // Workbook keeps trust administration in Medium unless insolvency changes the primary lane.
            return 'Medium';

        case 'INFORMAL_PROBATE':
        case 'FORMAL_PROBATE':
        case 'INTESTATE':
        case 'SPOUSAL_PETITION':
        case 'MUNIMENT_OF_TITLE':
            return 'Medium';

        case 'ANCILLARY_PROBATE':
        case 'CONTESTED_ESTATE':
        case 'INSOLVENT_ESTATE':
            return 'Complex';

        default:
            return 'Medium';
    }
}

function mapTimeline(pathType: string): string {
    switch (pathType) {
        case 'SMALL_ESTATE':
            return '1–4 months';
        case 'TRUST_ADMIN_REVOCABLE':
            return '2–6 months';
        case 'TRUST_ADMIN_IRREVOCABLE':
            return '3–9 months';
        case 'INFORMAL_PROBATE':
            return '4–9 months';
        case 'INTESTATE':
            return '8–18 months';
        case 'FORMAL_PROBATE':
        case 'SPOUSAL_PETITION':
        case 'MUNIMENT_OF_TITLE':
            return '6–12 months';
        case 'ANCILLARY_PROBATE':
            return '9–18 months';
        case 'CONTESTED_ESTATE':
            return '12–24+ months';
        case 'INSOLVENT_ESTATE':
            return '6–18+ months';
        default:
            return '6–12 months';
    }
}

function generateNextSteps(
    pathType: string,
    state: string,
    resolved: {
        hasWill: boolean;
        hasTrust: boolean;
        hasContest: boolean;
        isOutOfState: boolean;
        hasInsolvencyRisk: boolean;
        isSpouse: boolean;
    }
): string[] {
    // Universal first steps (appear in ALL 7 path types per XLSX)
    const universalSteps = [
        'Secure property & valuables (change locks, check insurance, utilities)',
        'Obtain 8–12 certified death certificates',
        'Locate key documents (will/trust, deeds, statements, insurance, tax returns)',
        'Notify SSA, employer, pension; stop improper payments; identify survivor benefits',
        'Forward/monitor mail; cancel subscriptions; freeze/monitor credit if needed',
        'Build asset & debt inventory (banks, brokerage, real estate, vehicles, loans, cards)',
    ];

    const pathSpecificSteps: Record<string, string[]> = {
        'INSOLVENT_ESTATE': [
            ...universalSteps,
            'Determine required authority (court/trust/affidavit) and open estate bank account',
            'STOP — do NOT distribute any assets until insolvency is resolved',
            'Prioritize creditor claims per statutory order (funeral expenses → admin costs → taxes → general creditors)',
            'Evaluate options: negotiate with creditors, structured payoff, or seek court guidance',
            'Provide notice to all known creditors and publish as required',
            'Close with final court-approved accounting reflecting insolvency',
            ...(resolved.isOutOfState ? ['Identify out-of-state assets; open ancillary proceeding if needed'] : []),
            ...(resolved.hasContest ? ['Preserve evidence; engage probate litigation counsel'] : []),
        ],
        'TRUST_ADMIN_REVOCABLE': [
            ...universalSteps,
            'Identify trustee; review trust document terms; confirm successor trustee acceptance',
            'Open trust administration bank account; marshal and re-title trust assets',
            'Notify beneficiaries and heirs per state notification rules; begin trust accounting',
            'Pay valid bills and claims; maintain receipts and documentation',
            'Prepare final trust accounting; distribute assets per trust terms; obtain receipts/releases',
            ...(resolved.isOutOfState ? ['Identify out-of-state assets; confirm ancillary requirements in that state', 'Open ancillary proceeding if needed; coordinate local title transfer'] : []),
            ...(resolved.hasContest ? ['Preserve evidence; engage probate litigation counsel; consider mediation'] : []),
        ],
        'TRUST_ADMIN_IRREVOCABLE': [
            ...universalSteps,
            'Identify trustee; carefully review irrevocable trust terms and trustee powers',
            'Open trust administration bank account; marshal trust assets',
            'Notify beneficiaries per state rules; obtain consents if required by trust terms',
            'Manage trust assets according to irrevocable trust terms (more restrictive than revocable)',
            'Prepare trust accounting (often required annually for irrevocable trusts)',
            'Distribute per trust terms; obtain receipts/releases from beneficiaries',
            ...(resolved.isOutOfState ? ['Identify out-of-state trust assets; coordinate ancillary proceedings if needed'] : []),
            ...(resolved.hasContest ? ['Preserve evidence; engage trust litigation counsel'] : []),
        ],
        'CONTESTED_ESTATE': [
            ...universalSteps,
            'File petition for probate with notice of contest',
            'Preserve ALL evidence; secure originals of will/trust and key communications',
            'Engage probate litigation counsel immediately; consider mediation/settlement strategy',
            'Obtain Letters Testamentary / Letters of Administration',
            'Freeze distributions until court resolution; expect extended timeline (12–24+ months)',
            'Attend all court hearings; comply with discovery requests',
            'Complete inventory, creditor notices, accounting, and final distribution under court supervision',
            ...(resolved.isOutOfState ? ['Coordinate ancillary litigation in out-of-state jurisdictions'] : []),
        ],
        'ANCILLARY_PROBATE': [
            ...universalSteps,
            'Open primary probate proceeding in home state first',
            'Identify all out-of-state assets (especially real property)',
            'Research ancillary probate requirements for each out-of-state jurisdiction',
            'File ancillary probate petition in each state where real property is located',
            'Obtain ancillary letters testamentary in each state',
            'Handle out-of-state title transfer, notices, and court requirements per that state\'s rules',
            'Coordinate timelines between primary and ancillary proceedings',
            ...(resolved.hasContest ? ['Address contest in all relevant jurisdictions'] : []),
        ],
        'INTESTATE': [
            ...universalSteps,
            'No will found — estate will be distributed per state intestacy laws',
            'File petition for letters of administration (court appoints administrator)',
            'Identify all legal heirs per state succession statutes',
            'Obtain Letters of Administration and EIN; open estate bank account',
            'Serve/publish required notices to heirs and creditors',
            'Inventory assets and obtain appraisals as required',
            'Pay valid claims and expenses; keep court-compliant accounting',
            'Petition for final distribution per intestacy laws; distribute; close estate',
            ...(resolved.isSpouse ? ['Identify and protect surviving spouse\'s rights (homestead, family allowance, elective share)'] : []),
        ],
        'FORMAL_PROBATE': [
            ...universalSteps,
            `File petition for probate${resolved.hasWill ? ' with will' : ''} with the probate court`,
            'Obtain Letters Testamentary and EIN; open estate bank account',
            'Serve/publish required notices to heirs/beneficiaries and creditors',
            'Inventory assets; obtain appraisals/valuations as required',
            'Review and pay approved claims and expenses; keep court-compliant accounting',
            'Petition for final distribution; distribute assets per will/intestacy; close estate',
            ...(resolved.isSpouse ? ['Identify and protect surviving spouse\'s rights'] : []),
        ],
        'INFORMAL_PROBATE': [
            ...universalSteps,
            'File petition for informal probate (available in UPC states — check eligibility)',
            'Obtain Letters Testamentary (issued without formal hearing in UPC states)',
            'Notify interested persons; publish creditor notice',
            'Inventory assets; pay valid claims; keep accounting records',
            'Distribute assets per will; close estate (informal closing statement or court order)',
            ...(resolved.isSpouse ? ['Confirm surviving spouse\'s rights under state UPC rules'] : []),
        ],
        'SMALL_ESTATE': [
            ...universalSteps,
            `Wait required period (${state ? `check ${state} small estate waiting period` : 'check state waiting period'})`,
            'Confirm estate qualifies under state small estate threshold',
            'Prepare and notarize Small Estate Affidavit (or Summary Administration petition for FL)',
            'Submit affidavit to each institution with certified death certificate',
            'Transfer assets directly without formal probate court involvement',
            ...(resolved.isSpouse ? ['Confirm surviving spouse\'s simplified succession rights'] : []),
        ],
        'SPOUSAL_PETITION': [
            ...universalSteps,
            'Confirm surviving spouse\'s rights under state law (homestead, family allowance, elective share)',
            'File spousal petition or summary administration if applicable',
            'Obtain court order authorizing spousal succession',
            'Transfer assets per spousal rights and any will provisions',
            'Distribute remaining assets to other heirs per will/intestacy',
        ],
        'MUNIMENT_OF_TITLE': [
            ...universalSteps,
            'Confirm Texas Muniment of Title eligibility (valid will, no debts except liens)',
            'File petition to probate will as Muniment of Title (no personal representative)',
            'Obtain court order admitting will to probate as Muniment of Title',
            'Use court order to transfer title to real property directly to beneficiaries',
            'Transfer financial accounts per beneficiary designations or court order',
        ],
    };

    return pathSpecificSteps[pathType] || pathSpecificSteps['FORMAL_PROBATE'];
}

/**
 * Generate legal warning flags based on detected risk factors.
 * These are shown prominently in the UI to prevent legal mistakes.
 */
function generateWarningFlags(resolved: {
    hasInsolvencyRisk: boolean;
    hasContest: boolean;
    isOutOfState: boolean;
    isSpouse: boolean;
    isTrustRevocable: boolean | undefined;
    hasTrust: boolean;
}): string[] {
    const flags: string[] = [];

    if (resolved.hasInsolvencyRisk) {
        flags.push(
            '⚠️ INSOLVENT ESTATE: Do NOT distribute any assets to heirs until all creditor claims are resolved in the legally required priority order. Premature distributions may result in personal liability for the executor/administrator.'
        );
    }
    if (resolved.hasContest) {
        flags.push(
            '⚠️ CONTESTED ESTATE: Preserve all evidence immediately. Do NOT destroy documents, make distributions, or take major actions without consulting a probate litigation attorney.'
        );
    }
    if (resolved.isOutOfState) {
        flags.push(
            '⚠️ OUT-OF-STATE ASSETS: Each state where real property is located may require a separate ancillary probate proceeding with local legal counsel. Do not attempt to transfer out-of-state real property without confirming local requirements.'
        );
    }
    if (resolved.isTrustRevocable === false) {
        flags.push(
            '⚠️ IRREVOCABLE TRUST: Trustee powers and distribution rules are strictly defined by the trust document. Any deviation may breach fiduciary duty. Consult an estate attorney before taking action.'
        );
    }

    return flags;
}
