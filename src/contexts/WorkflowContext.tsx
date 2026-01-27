/**
 * Workflow Context
 * 
 * Provides unified state management for the settlement workflow,
 * connecting roadmap phases with assets, probate status, and progress tracking.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { calculateAssetPhase, getAssetsByPhase, type AssetPhaseStatus } from '@/lib/assetPhase';
import { getPhaseLocksStatus, type PhaseLockStatus } from '@/lib/phaseLock';
import type { SettlementPhase } from '@/components/SettlementPhaseChevron';

interface PhaseProgress {
  completed: number;
  total: number;
  percentage: number;
}

interface WorkflowContextValue {
  currentPhase: SettlementPhase;
  setCurrentPhase: (phase: SettlementPhase) => void;
  assetsByPhase: Record<AssetPhaseStatus, any[]>;
  phaseLocks: Record<SettlementPhase, PhaseLockStatus>;
  probateBlockers: any[];
  phaseProgress: Record<SettlementPhase, PhaseProgress>;
  completedTaskIds: string[];
  completedPhases: SettlementPhase[];
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [currentPhase, setCurrentPhase] = useState<SettlementPhase>('immediate_actions');

  const { data: estate } = useQuery({
    queryKey: ['estate'],
    queryFn: api.getMyEstate
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: api.getAssets
  });

  // Calculate asset distribution by phase
  const assetsByPhase = getAssetsByPhase(assets, estate);

  // Calculate phase locks
  const phaseLocks: Record<SettlementPhase, PhaseLockStatus> = {
    immediate_actions: { isLocked: false },
    court_filing: { isLocked: false },
    asset_discovery: getPhaseLocksStatus('asset_discovery', estate, assets),
    creditor_claims: getPhaseLocksStatus('creditor_claims', estate, assets),
    asset_liquidation: getPhaseLocksStatus('asset_liquidation', estate, assets),
    final_distribution: getPhaseLocksStatus('final_distribution', estate, assets)
  };

  // Find probate blockers (INDIVIDUAL assets without Letters)
  const probateBlockers = assets.filter((a: any) =>
    a.ownershipType === 'INDIVIDUAL' && !estate?.lettersReceived
  );

  // Extract completed tasks and phases from estate
  const completedTaskIds = estate?.roadmapProgress?.completedTaskIds || [];
  const completedPhases = estate?.roadmapProgress?.completedPhases || [];

  // Calculate phase progress
  const phaseProgress: Record<SettlementPhase, PhaseProgress> = {
    immediate_actions: calculateProgress('immediate_actions', completedTaskIds),
    court_filing: calculateProgress('court_filing', completedTaskIds),
    asset_discovery: calculateProgress('asset_discovery', completedTaskIds),
    creditor_claims: calculateProgress('creditor_claims', completedTaskIds),
    asset_liquidation: calculateProgress('asset_liquidation', completedTaskIds),
    final_distribution: calculateProgress('final_distribution', completedTaskIds)
  };

  // Auto-set current phase based on progress
  useEffect(() => {
    if (completedPhases.includes('immediate_actions') && !completedPhases.includes('court_filing')) {
      setCurrentPhase('court_filing');
    } else if (completedPhases.includes('court_filing') && !completedPhases.includes('asset_discovery')) {
      setCurrentPhase('asset_discovery');
    } else if (completedPhases.includes('asset_discovery') && !completedPhases.includes('creditor_claims')) {
      setCurrentPhase('creditor_claims');
    } else if (completedPhases.includes('creditor_claims') && !completedPhases.includes('asset_liquidation')) {
      setCurrentPhase('asset_liquidation');
    } else if (completedPhases.includes('asset_liquidation') && !completedPhases.includes('final_distribution')) {
      setCurrentPhase('final_distribution');
    }
  }, [completedPhases]);

  return (
    <WorkflowContext.Provider value={{
      currentPhase,
      setCurrentPhase,
      assetsByPhase,
      phaseLocks,
      probateBlockers,
      phaseProgress,
      completedTaskIds,
      completedPhases
    }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
}

// Helper function to calculate progress for a phase
function calculateProgress(phase: SettlementPhase, completedTaskIds: string[]): PhaseProgress {
  // Import phase tasks (we'll need to update settlementPhases.ts to export task counts)
  const taskCounts: Record<SettlementPhase, number> = {
    immediate_actions: 6,
    court_filing: 5,
    asset_discovery: 5,
    creditor_claims: 5,
    asset_liquidation: 5,
    final_distribution: 5
  };

  const total = taskCounts[phase] || 0;
  const completed = completedTaskIds.filter(id => id.startsWith(phase)).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}
