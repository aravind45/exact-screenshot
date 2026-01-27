/**
 * Asset Phase Calculation
 * 
 * Determines which settlement phase an asset belongs to based on its
 * status, ownership type, and estate state.
 */

export type AssetPhaseStatus = 
  | 'immediate_actions'    // Just discovered
  | 'court_filing'         // Blocked by probate
  | 'asset_discovery'      // Ready for DOD values
  | 'creditor_claims'      // In review/claims
  | 'liquidation'          // Ready to sell
  | 'final_distribution';  // Distributed

export function calculateAssetPhase(
  asset: any,
  estate: any
): AssetPhaseStatus {
  // Phase 0: Newly discovered
  if (asset.status === 'DISCOVERED') {
    return 'immediate_actions';
  }
  
  // Phase 1: Blocked by probate (INDIVIDUAL ownership only)
  if (asset.ownershipType === 'INDIVIDUAL' && !estate?.lettersReceived) {
    return 'court_filing';
  }
  
  // Phase 2: Asset discovery (contacted, waiting for docs)
  if (['CONTACTED', 'NOTIFIED', 'PENDING_DOCUMENTS'].includes(asset.status)) {
    return 'asset_discovery';
  }
  
  // Phase 3: Creditor claims (in review)
  if (['IN_REVIEW', 'CLAIM_FILED', 'CLAIM_PENDING'].includes(asset.status)) {
    return 'creditor_claims';
  }
  
  // Phase 4: Liquidation (approved, ready to distribute)
  if (['APPROVED', 'READY_TO_DISTRIBUTE', 'PENDING_SALE'].includes(asset.status)) {
    return 'liquidation';
  }
  
  // Phase 5: Final distribution (done)
  if (['DISTRIBUTED', 'CLOSED'].includes(asset.status)) {
    return 'final_distribution';
  }
  
  return 'immediate_actions'; // Default fallback
}

export function getAssetsByPhase(
  assets: any[],
  estate: any
): Record<AssetPhaseStatus, any[]> {
  const byPhase: Record<AssetPhaseStatus, any[]> = {
    immediate_actions: [],
    court_filing: [],
    asset_discovery: [],
    creditor_claims: [],
    liquidation: [],
    final_distribution: []
  };
  
  assets.forEach(asset => {
    const phase = calculateAssetPhase(asset, estate);
    byPhase[phase].push(asset);
  });
  
  return byPhase;
}

export function getAssetPhaseLabel(phase: AssetPhaseStatus): string {
  const labels: Record<AssetPhaseStatus, string> = {
    immediate_actions: 'Phase 0: Immediate Actions',
    court_filing: 'Phase 1: Court Filing',
    asset_discovery: 'Phase 2: Asset Discovery',
    creditor_claims: 'Phase 3: Creditor Claims',
    liquidation: 'Phase 4: Liquidation',
    final_distribution: 'Phase 5: Final Distribution'
  };
  return labels[phase];
}
