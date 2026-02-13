// src/lib/assetClassification.ts

export type AssetLegalClass = 'PROBATE' | 'NON_PROBATE' | 'UNKNOWN';

export interface ActionSuggestion {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    icon: string;
}

export function classifyAsset(asset: { authorityType?: string; ownershipType?: string }): AssetLegalClass {
    const authType = asset.authorityType;

    if (['COURT_REQUIRED', 'AFFIDAVIT_SMALL'].includes(authType || '')) return 'PROBATE';
    if (['TRUSTEE_DIRECT', 'BENEFICIARY_CONTRACT', 'SURVIVORSHIP_TITLE'].includes(authType || '')) return 'NON_PROBATE';

    // Fallback based on ownershipType if authorityType is UNSET
    if (asset.ownershipType === 'INDIVIDUAL') return 'PROBATE';
    if (['TRUST', 'JOINT', 'BENEFICIARY'].includes(asset.ownershipType || '')) return 'NON_PROBATE';

    return 'UNKNOWN';
}

export function getSuggestedActions(asset: any, estateState?: string): ActionSuggestion[] {
    const actions: ActionSuggestion[] = [];
    const legalClass = classifyAsset(asset);
    const type = (asset.assetType || '').toUpperCase();
    const category = (asset.category || '').toLowerCase();

    // 1. Universal Actions for Discovered Assets
    if (asset.status === 'discovered') {
        actions.push({
            id: 'notify_institution',
            title: 'Notify Institution',
            description: `Contact ${asset.institution} to report the death and freeze the account.`,
            priority: 'high',
            icon: 'Mail'
        });
    }

    // 2. Probate Specific Actions
    if (legalClass === 'PROBATE') {
        if (!asset.dateOfDeathValue) {
            actions.push({
                id: 'obtain_dod_value',
                title: 'Obtain DOD Value',
                description: 'Determine the exact balance or value as of the date of death for court inventory.',
                priority: 'high',
                icon: 'FileText'
            });
        }

        if (asset.authorityType === 'COURT_REQUIRED') {
            actions.push({
                id: 'wait_for_letters',
                title: 'Await Letters',
                description: 'This asset is blocked until you receive Letters Testamentary from the court.',
                priority: 'medium',
                icon: 'Gavel'
            });
        }
    }

    // 3. Non-Probate Specific Actions
    if (legalClass === 'NON_PROBATE') {
        if (asset.authorityType === 'BENEFICIARY_CONTRACT' || asset.authorityType === 'SURVIVORSHIP_TITLE') {
            actions.push({
                id: 'claim_transfer',
                title: 'Initiate Direct Transfer',
                description: 'Submit a death certificate to the institution to transfer funds directly to the beneficiary.',
                priority: 'high',
                icon: 'ArrowRight'
            });
        }

        if (asset.authorityType === 'TRUSTEE_DIRECT') {
            actions.push({
                id: 'trustee_coordination',
                title: 'Coordinate with Trustee',
                description: 'The Successor Trustee can manage this asset immediately without court intervention.',
                priority: 'medium',
                icon: 'Users'
            });
        }
    }

    // 4. Category-Specific Actions
    if (category === 'property' || type === 'REAL_ESTATE') {
        actions.push({
            id: 'secure_property',
            title: 'Secure Property',
            description: 'Ensure the property is locked, insured, and maintenance is continued.',
            priority: 'high',
            icon: 'ShieldCheck'
        });
    }

    return actions;
}
