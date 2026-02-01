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

export interface PhaseProgress {
  completed: number;
  total: number;
  percentage: number;
}

export type LegalRiskLevel = 'INFO' | 'WARNING' | 'CRITICAL';

export interface LegalRisk {
  id: string;
  level: LegalRiskLevel;
  title: string;
  description: string;
  mitigation?: string;
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
  legalRisks: LegalRisk[];
  assets: any[];
  liabilities: any[];
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

  const { data: liabilities = [] } = useQuery({
    queryKey: ['liabilities'],
    queryFn: api.getLiabilities
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['estate', 'documents'],
    queryFn: api.getEstateDocuments,
    enabled: !!estate
  });

  const { data: stateConfig } = useQuery({
    queryKey: ['liabilities', 'priority-options'],
    queryFn: api.getPriorityOptions
  });

  // Calculate asset distribution by phase
  const assetsByPhase = getAssetsByPhase(assets, estate);

  // Calculate phase locks
  const phaseLocks: Record<SettlementPhase, PhaseLockStatus> = {
    immediate_actions: { isLocked: false },
    court_filing: { isLocked: false },
    asset_discovery: getPhaseLocksStatus('asset_discovery', estate, assets, documents, liabilities),
    creditor_claims: getPhaseLocksStatus('creditor_claims', estate, assets, documents, liabilities),
    asset_liquidation: getPhaseLocksStatus('asset_liquidation', estate, assets, documents, liabilities),
    final_distribution: getPhaseLocksStatus('final_distribution', estate, assets, documents, liabilities)
  };

  // Find probate blockers
  const authorityGranted = phaseLocks.asset_discovery.isLocked === false;
  const probateBlockers = assets.filter((a: any) =>
    a.ownershipType === 'INDIVIDUAL' && !authorityGranted
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

  // Calculate Legal Risks
  const legalRisks: LegalRisk[] = [];
  const totalAssets = assets.reduce((sum: number, a: any) => sum + (a.value || 0), 0);
  const totalDebt = liabilities.reduce((sum: number, l: any) => sum + Number(l.amount), 0);

  // 1. Insolvency Risk
  if (totalDebt > totalAssets && totalAssets > 0) {
    legalRisks.push({
      id: 'insolvency',
      level: 'CRITICAL',
      title: 'Estate is Insolvent',
      description: 'Total liabilities exceed total assets. You are legally required to follow statutory priority order for payments exactly to avoid personal liability.',
      mitigation: 'Consult an attorney before making ANY payments.'
    });
  }

  // 2. Premature Distribution Risk
  const noticePublished = completedTaskIds.includes('court_filing_publish_notice');
  const noticePeriodDays = stateConfig?.creditorNoticePeriodDays || 120;
  const noticePeriodMs = noticePeriodDays * 24 * 60 * 60 * 1000;

  const noticeDate = estate?.dateOfNoticePublication;
  const periodExpired = noticeDate && (new Date().getTime() - new Date(noticeDate).getTime()) > noticePeriodMs;

  if (completedPhases.includes('final_distribution') && !periodExpired) {
    legalRisks.push({
      id: 'early_distribution',
      level: 'CRITICAL',
      title: 'Potential Premature Distribution',
      description: `The statutory ${Math.round(noticePeriodDays / 30)}-month (${noticePeriodDays} days) creditor notice period for ${stateConfig?.state || 'the state'} has not yet expired. Distributing assets now may create personal liability risk and conflict with standard fiduciary guidelines.`,
      mitigation: 'Wait for the notice period to expire before final distribution.'
    });
  }

  // 3. Priority Violation Risk
  // We determine "High Priority" as anything ranked significantly higher than "General Debts" (usually the last rank)
  const priorityOptions = stateConfig?.options || [];
  const generalRule = priorityOptions.find((o: any) => o.classId.includes('GENERAL'));
  const generalRank = generalRule ? generalRule.rank : 999;

  const highPriorityUnpaid = liabilities.some((l: any) => {
    const rule = priorityOptions.find((o: any) => o.classId === l.priorityClass);
    return rule && rule.rank < generalRank && l.status !== 'PAID';
  });

  const lowPriorityPaid = liabilities.some((l: any) => {
    const rule = priorityOptions.find((o: any) => o.classId === l.priorityClass);
    return rule && rule.rank >= generalRank && l.status === 'PAID';
  });

  if (highPriorityUnpaid && lowPriorityPaid) {
    legalRisks.push({
      id: 'priority_violation',
      level: 'CRITICAL',
      title: 'Potential Statutory Priority conflict',
      description: `Higher priority claims (Rank < ${generalRank}) remain unpaid while lower priority debts appear to have been settled. In ${stateConfig?.state || 'this state'}, this conflict should be reviewed for fiduciary compliance.`,
      mitigation: 'Stop all payments and re-verify project priority according to state law.'
    });
  }

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
      completedPhases,
      legalRisks,
      assets,
      liabilities
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
