import { Asset, Estate } from "./api";

export type AssetTaxonomyState =
    | 'action_required'
    | 'waiting'
    | 'blocked'
    | 'monitoring'
    | 'ready'
    | 'resolved';

export interface TaxonomyInfo {
    state: AssetTaxonomyState;
    label: string;
    secondary: string;
    subtext?: string;
    cta: string;
    ctaSubtext: string;
    color: string;
    trailPrefix: string;
}

export const TAXONOMY_CONFIG: Record<AssetTaxonomyState, TaxonomyInfo> = {
    action_required: {
        state: 'action_required',
        label: 'Action Required',
        secondary: 'This asset needs your attention to avoid delay or risk.',
        cta: 'Take Action Now',
        ctaSubtext: 'This step unlocks the next phase of settlement.',
        color: 'red',
        trailPrefix: 'ACTION REQUIRED'
    },
    waiting: {
        state: 'waiting',
        label: 'Waiting on Institution',
        secondary: 'You’ve completed your step. We’re waiting for a response.',
        cta: 'Schedule Follow-Up',
        ctaSubtext: 'Or wait — no action is required right now.',
        color: 'orange',
        trailPrefix: 'WAITING'
    },
    blocked: {
        state: 'blocked',
        label: 'Blocked',
        secondary: 'This step can’t proceed until a required legal condition is met.',
        cta: 'View Requirement',
        ctaSubtext: 'This action will unlock once the requirement is met.',
        color: 'purple',
        trailPrefix: 'BLOCKED'
    },
    monitoring: {
        state: 'monitoring',
        label: 'Monitoring',
        secondary: 'No action needed right now. We’ll notify you if this changes.',
        cta: 'View Details',
        ctaSubtext: 'We’ll alert you if action becomes necessary.',
        color: 'yellow',
        trailPrefix: 'MONITORING'
    },
    ready: {
        state: 'ready',
        label: 'Ready for Inventory',
        secondary: 'Documentation is complete and ready for court filing.',
        cta: 'Include in Inventory',
        ctaSubtext: 'This asset is ready for court documentation.',
        color: 'blue',
        trailPrefix: 'READY'
    },
    resolved: {
        state: 'resolved',
        label: 'Resolved',
        secondary: 'No further action is required for this asset.',
        cta: 'View Record',
        ctaSubtext: 'This asset is complete and archived.',
        color: 'green',
        trailPrefix: 'RESOLVED'
    }
};

export function getAssetTaxonomyState(asset: Asset, estate?: Estate): AssetTaxonomyState {
    const status = asset.status?.toLowerCase() || '';

    // 1. Resolved
    if (['distributed', 'closed'].includes(status)) {
        return 'resolved';
    }

    // 2. Ready for Inventory
    // If we have DOD value or status is approved
    if (status === 'approved' || (asset.value && asset.value > 0)) {
        return 'ready';
    }

    // 3. Blocked
    // If we have an explicit authority type, use it
    if (asset.authorityType === 'COURT_REQUIRED' && !estate?.appointedDate) {
        return 'blocked';
    }

    if (asset.authorityType === 'LITIGATION_HOLD') {
        return 'blocked';
    }

    // Legacy fallback for backward compatibility
    if (!asset.authorityType) {
        const likelyRequiresAuthority = ['financial', 'retirement', 'insurance'].includes(asset.assetType?.toLowerCase() || '');
        if (likelyRequiresAuthority && (!estate?.appointedDate)) {
            return 'blocked';
        }
    }

    // 4. Waiting on Institution
    if (['contacted', 'documents_submitted', 'in_review'].includes(status)) {
        return 'waiting';
    }

    // 5. Action Required
    if (status === 'discovered' || !status) {
        return 'action_required';
    }

    // 6. Monitoring (Catch-all)
    return 'monitoring';
}

export function getTaxonomyInfo(asset: Asset, estate?: Estate): TaxonomyInfo {
    const state = getAssetTaxonomyState(asset, estate);
    const info = { ...TAXONOMY_CONFIG[state] };

    // Contextual Subtext Overrides
    if (state === 'action_required') {
        if (asset.status === 'discovered') info.subtext = 'Institution not yet notified';
        else info.subtext = 'Account not yet secured';
    } else if (state === 'blocked') {
        info.subtext = 'Awaiting Letters Testamentary';
    } else if (state === 'waiting') {
        // This would ideally come from communications, but we'll use a placeholder or handle in component
        info.subtext = 'Awaiting institution response';
    }

    return info;
}
