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
import { type SettlementPhase } from '@/config/settlementPhases';
import { useAuth } from '@/contexts/AuthContext';
import { calculateAuthorityRecommendation } from '@/lib/authorityEngine';
import { generateRoadmap } from '@/config/roadmapGenerator';
import { useMemo } from 'react';

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
  totalTaskCount: number;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentPhase, setCurrentPhase] = useState<SettlementPhase>('immediate_actions');

  // Only fetch executor-specific data for executors, not advisors
  const isExecutor = user && user.role !== 'ADVISOR' && user.userType !== 'ADVISOR';

  const { data: estate } = useQuery({
    queryKey: ['estate'],
    queryFn: api.getMyEstate,
    enabled: !!isExecutor
  });

  const { data: assetsData } = useQuery({
    queryKey: ['assets'],
    queryFn: api.getAssets,
    enabled: !!isExecutor
  });
  const assets = Array.isArray(assetsData) ? assetsData : [];

  const { data: liabilitiesData } = useQuery({
    queryKey: ['liabilities'],
    queryFn: api.getLiabilities,
    enabled: !!isExecutor
  });
  const liabilities = Array.isArray(liabilitiesData) ? liabilitiesData : [];

  const { data: documentsData } = useQuery({
    queryKey: ['estate', 'documents'],
    queryFn: api.getEstateDocuments,
    enabled: !!isExecutor && !!estate
  });
  const documents = Array.isArray(documentsData) ? documentsData : [];

  const { data: stateConfig } = useQuery({
    queryKey: ['liabilities', 'priority-options'],
    queryFn: api.getPriorityOptions,
    enabled: !!isExecutor
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

  // Calculate dynamic roadmap
  const roadmap = useMemo(() => {
    if (!estate) return [];

    const recommendation = calculateAuthorityRecommendation(assets, estate.deceasedState || 'CA', {
      hasWill: estate.hasWill,
      isSpouse: estate.isSurvivingSpouse,
      isOutOfState: estate.hasOutOfStateProperty,
      estimatedValue: estate.estimatedPersonalProperty,
      isTrustRevocable: estate.isTrustRevocable,
      hasTODDeed: estate.hasTODDeed,
      hasContest: estate.hasContest
    });

    const modifiers = [...(recommendation.modifiers || [])];
    if (estate.isInternational) modifiers.push("INTERNATIONAL_MODE");

    return generateRoadmap(recommendation.type, estate.deceasedState || 'CA', modifiers, recommendation.activeEngines);
  }, [estate, assets]);

  // Calculate phase progress based on actual roadmap
  const phaseProgress: Record<SettlementPhase, PhaseProgress> = useMemo(() => {
    const progress: Record<string, PhaseProgress> = {};

    // Initialize all possible phases with 0/0
    const allPhases: SettlementPhase[] = [
      'immediate_actions', 'court_filing', 'asset_discovery',
      'creditor_claims', 'asset_liquidation', 'final_distribution'
    ];
    allPhases.forEach(p => {
      progress[p] = { completed: 0, total: 0, percentage: 0 };
    });

    roadmap.forEach(phase => {
      const total = phase.tasks.length;
      const completed = completedTaskIds.filter(id => id.startsWith(phase.phase)).length;
      progress[phase.phase] = {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
    return progress;
  }, [roadmap, completedTaskIds]);

  const totalTaskCount = useMemo(() => {
    return roadmap.reduce((sum, phase) => sum + (phase.tasks?.length || 0), 0);
  }, [roadmap]);

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
      liabilities,
      totalTaskCount
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

// Helper function to calculate progress for a phase (keeping for legacy if needed, but discouraged)
function calculateProgress(phase: SettlementPhase, completedTaskIds: string[]): PhaseProgress {
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
