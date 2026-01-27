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
  assets: any[]
): PhaseLockStatus {
  switch (phase) {
    case 'immediate_actions':
    case 'court_filing':
      return { isLocked: false }; // Always accessible
      
    case 'asset_discovery':
      if (!estate?.lettersReceived) {
        return {
          isLocked: true,
          reason: 'Letters Testamentary (DE-150) required',
          unlockAction: {
            label: 'Upload Letters',
            route: '/probate?action=upload-letters'
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
      
    case 'liquidation':
      // For now, always unlocked (TODO: Check if all claims resolved)
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
            route: '/assets?phase=liquidation'
          }
        };
      }
      return { isLocked: false };
      
    default:
      return { isLocked: false };
  }
}
