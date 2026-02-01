/**
 * Phase Lock Logic
 * 
 * Determines if a settlement phase is locked and what conditions
 * are needed to unlock it.
 */

import type { SettlementPhase } from '@/components/SettlementPhaseChevron';

export interface PhaseLockStatus {
  isLocked: boolean;
  reason?: string;
  unlockAction?: {
    label: string;
    route: string;
  };
}

export function getPhaseLocksStatus(
  phase: SettlementPhase,
  estate: any,
  assets: any[],
  documents: any[] = [],
  liabilities: any[] = [] // New parameter
): PhaseLockStatus {
  const track = estate?.estateType;

  // Unified authority check based on track
  const hasAuthority = () => {
    if (estate?.lettersReceived) return true; // Legacy flag

    const docTypes = documents.map(d => d.documentType);

    switch (track) {
      case 'SMALL_ESTATE':
        return docTypes.includes('DE-310') || docTypes.includes('SMALL_ESTATE_AFFIDAVIT');
      case 'SPOUSAL_PETITION':
        return docTypes.includes('DE-226'); // Spousal Order
      case 'TRUST_ADMIN':
        return docTypes.includes('TRUST_CERT') || docTypes.includes('TRUSTEE_ACC') || docTypes.includes('TRUST_CERTIFICATION');
      case 'JOINT_TRANSFER':
      case 'POD_TOD_TRANSFER':
        return true; // Usually no court authority needed
      default:
        return docTypes.includes('DE-150') || docTypes.includes('LETTERS_TESTAMENTARY') || docTypes.includes('LETTERS_OF_ADMIN');
    }
  };

  const authorityGranted = hasAuthority();

  switch (phase) {
    case 'immediate_actions':
    case 'court_filing':
      return { isLocked: false }; // Always accessible

    case 'asset_discovery':
      if (!authorityGranted) {
        let docLabel = 'Letters Testamentary (DE-150)';
        if (track === 'SMALL_ESTATE') docLabel = 'Small Estate Affidavit (DE-310)';
        else if (track === 'SPOUSAL_PETITION') docLabel = 'Spousal Order (DE-226)';
        else if (track === 'TRUST_ADMIN') docLabel = 'Trust Certification';

        return {
          isLocked: true,
          reason: `${docLabel} required`,
          unlockAction: {
            label: 'Upload Documents',
            route: track === 'SMALL_ESTATE' || track === 'TRUST_ADMIN' ? '/vault' : '/probate'
          }
        };
      }
      return { isLocked: false };

    case 'creditor_claims':
      const discoveryComplete = assets.every((a: any) =>
        !['DISCOVERED', 'CONTACTED', 'NOTIFIED'].includes(a.status)
      );
      if (!discoveryComplete) {
        return {
          isLocked: true,
          reason: 'Complete asset discovery first',
          unlockAction: {
            label: 'View Assets',
            route: '/assets?phase=asset_discovery'
          }
        };
      }
      return { isLocked: false };

    case 'asset_liquidation':
      // 1. Check if all creditor tasks are done (using liabilities status as proxy)
      // Pending statuses: 'DISCOVERED', 'NOTICE_SENT', 'CLAIM_FILED'
      // Resolved statuses: 'APPROVED', 'REJECTED', 'PAID', 'BARRED'
      const liabilitiesPending = liabilities.some((l: any) =>
        ['DISCOVERED', 'NOTICE_SENT', 'CLAIM_FILED'].includes(l.status)
      );

      if (liabilitiesPending) {
        return {
          isLocked: true,
          reason: 'Resolve all creditor claims first',
          unlockAction: {
            label: 'View Claims',
            route: '/liabilities'
          }
        };
      }
      return { isLocked: false };

    case 'final_distribution':
      const liquidationComplete = assets.every((a: any) =>
        ['DISTRIBUTED', 'CLOSED', 'READY_TO_DISTRIBUTE'].includes(a.status)
      );
      if (!liquidationComplete) {
        return {
          isLocked: true,
          reason: 'Complete liquidation first',
          unlockAction: {
            label: 'View Assets',
            route: '/assets?phase=asset_liquidation'
          }
        };
      }
      return { isLocked: false };

    default:
      return { isLocked: false };
  }
}
