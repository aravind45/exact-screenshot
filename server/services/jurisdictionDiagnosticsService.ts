/**
 * Jurisdiction Diagnostics Service
 * 
 * Server-side service for running diagnostics and managing jurisdiction health.
 * Used by the Admin Jurisdiction Health Dashboard.
 */

import { prisma } from '../db.js';
import type {
  JurisdictionDiagnosticReport,
  DiagnosticRunRecord,
  HealthTrendPoint,
  JurisdictionHealthSummary,
  EstateProfile,
  DiagnosticTask,
} from '../../src/jurisdiction/diagnostics/types.js';
import { runAllValidators, calculateHealthScore } from '../../src/jurisdiction/diagnostics/index.js';
import { filterTasksByJurisdiction, filterTasksByAuthorityScope, type ScopedTask } from '../../src/shared/filterByJurisdiction.js';
import { SETTLEMENT_PHASE_TASKS } from '../../src/config/settlementPhases.js';
import { logger } from '../lib/logger.js';

// Cache for diagnostic results (TTL: 5 minutes)
const diagnosticsCache = new Map<string, { result: JurisdictionDiagnosticReport; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Get tasks for a state from the settlement phases config
 */
function getTasksForState(stateCode: string): ScopedTask[] {
  const tasks: ScopedTask[] = [];

  for (const phaseList of SETTLEMENT_PHASE_TASKS) {
    for (const task of phaseList.tasks) {
      tasks.push({
        id: task.id,
        scope: task.scope,
        authorityScope: task.authorityScope,
      });
    }
  }

  return tasks;
}

/**
 * Filter tasks for an estate profile
 */
function filterTasksForProfile(
  tasks: ScopedTask[],
  profile: EstateProfile
): ScopedTask[] {
  // First filter by jurisdiction (state)
  const jurisdictionResult = filterTasksByJurisdiction(tasks, profile.stateCode, profile.county);
  let filtered = jurisdictionResult.kept;

  // Then filter by authority scope
  const authorityResult = filterTasksByAuthorityScope(filtered, profile.authorityType);
  filtered = authorityResult.kept;

  return filtered;
}

/**
 * Run diagnostics for a specific state
 */
export async function runDiagnostics(
  stateCode: string,
  options: {
    useCache?: boolean;
    estateProfile?: EstateProfile;
  } = {}
): Promise<JurisdictionDiagnosticReport> {
  const cacheKey = `${stateCode}:${options.estateProfile?.id || 'default'}`;

  // Check cache
  if (options.useCache !== false) {
    const cached = diagnosticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      logger.debug({ stateCode }, 'Returning cached diagnostic result');
      return cached.result;
    }
  }

  // Default profile if not provided
  const profile = options.estateProfile || {
    id: `default_${stateCode.toLowerCase()}`,
    name: `Default ${stateCode} Profile`,
    stateCode,
    authorityType: 'PROBATE',
    hasRealProperty: true,
    estateValue: 500000,
    hasWill: true,
    characteristics: {
      isSmallEstate: false,
      hasMinorBeneficiaries: false,
      hasContest: false,
      isInternational: false,
      hasTODDeed: false,
      hasOutOfStateProperty: false,
      isSurvivingSpouse: false,
    },
  };

  // Get and filter tasks
  const allTasks = getTasksForState(stateCode);
  const filteredTasks = filterTasksForProfile(allTasks, profile);

  // Run validators
  const report = await runAllValidators(stateCode, profile, filteredTasks);

  // Cache result
  diagnosticsCache.set(cacheKey, { result: report, timestamp: Date.now() });

  return report;
}

/**
 * Run diagnostics for multiple estate profiles in a state
 */
export async function runDiagnosticsForProfiles(
  stateCode: string,
  profiles: EstateProfile[]
): Promise<JurisdictionDiagnosticReport[]> {
  const results: JurisdictionDiagnosticReport[] = [];

  for (const profile of profiles) {
    const report = await runDiagnostics(stateCode, { estateProfile: profile, useCache: false });
    results.push(report);
  }

  return results;
}

/**
 * Calculate aggregate health score for a state
 */
export async function calculateHealthScoreForState(stateCode: string): Promise<number> {
  const report = await runDiagnostics(stateCode);
  return report.healthScore;
}

/**
 * Persist diagnostic run to database
 */
export async function persistDiagnosticRun(
  report: JurisdictionDiagnosticReport,
  triggeredBy: string,
  options: {
    commitSha?: string;
    branchName?: string;
  } = {}
): Promise<DiagnosticRunRecord> {
  const record = await prisma.diagnosticRun.create({
    data: {
      stateCode: report.stateCode,
      overallStatus: report.passed ? 'PASS' : 'FAIL',
      healthScore: report.healthScore,
      criticalCount: report.totalViolations.CRITICAL,
      warningCount: report.totalViolations.WARNING,
      infoCount: report.totalViolations.INFO,
      resultsJson: report as any,
      triggeredBy,
      commitSha: options.commitSha,
      branchName: options.branchName,
      durationMs: report.metadata.totalExecutionTimeMs,
    },
  });

  return {
    id: record.id,
    stateCode: record.stateCode,
    overallStatus: record.overallStatus as 'PASS' | 'FAIL',
    healthScore: record.healthScore,
    criticalCount: record.criticalCount,
    warningCount: record.warningCount,
    infoCount: record.infoCount,
    resultsJson: record.resultsJson as Record<string, unknown>,
    triggeredBy: record.triggeredBy,
    commitSha: record.commitSha || undefined,
    branchName: record.branchName || undefined,
    durationMs: record.durationMs,
    createdAt: record.createdAt.toISOString(),
  };
}

/**
 * Get diagnostic history for a state
 */
export async function getDiagnosticHistory(
  stateCode: string,
  options: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<DiagnosticRunRecord[]> {
  const records = await prisma.diagnosticRun.findMany({
    where: {
      stateCode,
      ...(options.startDate && { createdAt: { gte: options.startDate } }),
      ...(options.endDate && { createdAt: { lte: options.endDate } }),
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit || 50,
  });

  return records.map(record => ({
    id: record.id,
    stateCode: record.stateCode,
    overallStatus: record.overallStatus as 'PASS' | 'FAIL',
    healthScore: record.healthScore,
    criticalCount: record.criticalCount,
    warningCount: record.warningCount,
    infoCount: record.infoCount,
    resultsJson: record.resultsJson as Record<string, unknown>,
    triggeredBy: record.triggeredBy,
    commitSha: record.commitSha || undefined,
    branchName: record.branchName || undefined,
    durationMs: record.durationMs,
    createdAt: record.createdAt.toISOString(),
  }));
}

/**
 * Get health trend data for a state
 */
export async function getHealthTrend(
  stateCode: string,
  days: number = 30
): Promise<HealthTrendPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const records = await prisma.diagnosticRun.findMany({
    where: {
      stateCode,
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      createdAt: true,
      healthScore: true,
      criticalCount: true,
      warningCount: true,
    },
  });

  return records.map(record => ({
    timestamp: record.createdAt.toISOString(),
    healthScore: record.healthScore,
    criticalCount: record.criticalCount,
    warningCount: record.warningCount,
  }));
}

/**
 * Get health summary for all jurisdictions
 */
export async function getAllJurisdictionHealth(): Promise<JurisdictionHealthSummary[]> {
  // Get all states that have diagnostic runs
  const states = await prisma.diagnosticRun.findMany({
    distinct: ['stateCode'],
    orderBy: { stateCode: 'asc' },
    select: { stateCode: true },
  });

  // State name mapping
  const stateNames: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
  };

  const summaries: JurisdictionHealthSummary[] = [];

  for (const { stateCode } of states) {
    const latestRun = await prisma.diagnosticRun.findFirst({
      where: { stateCode },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestRun) continue;

    // Get trend (last 7 days)
    const trendData = await getHealthTrend(stateCode, 7);
    let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
    
    if (trendData.length >= 2) {
      const first = trendData[0].healthScore;
      const last = trendData[trendData.length - 1].healthScore;
      const diff = last - first;
      
      if (diff > 5) trend = 'IMPROVING';
      else if (diff < -5) trend = 'DECLINING';
    }

    // Get pending override count
    const pendingOverrides = await prisma.countyOverride.count({
      where: { status: 'PENDING' },
    });

    summaries.push({
      stateCode,
      stateName: stateNames[stateCode] || stateCode,
      healthScore: latestRun.healthScore,
      status: latestRun.healthScore >= 90 ? 'HEALTHY' : 
              latestRun.healthScore >= 70 ? 'DEGRADED' : 'CRITICAL',
      lastDiagnosticRun: latestRun.createdAt.toISOString(),
      totalViolations: latestRun.criticalCount + latestRun.warningCount + latestRun.infoCount,
      criticalViolations: latestRun.criticalCount,
      pendingOverrides: pendingOverrides,
      trend,
    });
  }

  return summaries;
}

/**
 * Preview roadmap for a given estate profile
 */
export async function previewRoadmap(profile: EstateProfile): Promise<{
  phases: Array<{
    phase: string;
    title: string;
    tasks: Array<{
      id: string;
      title: string;
      authorityScope?: string;
      description?: string;
    }>;
  }>;
  filteredCount: number;
  totalCount: number;
}> {
  const allTasks = getTasksForState(profile.stateCode);
  const totalCount = allTasks.length;
  
  const filteredTasks = filterTasksForProfile(allTasks, profile);
  const filteredCount = filteredTasks.length;

  // Group by phase
  const phases = SETTLEMENT_PHASE_TASKS
    .map(phaseList => ({
      phase: phaseList.phase,
      title: phaseList.title,
      tasks: phaseList.tasks
        .filter(t => filteredTasks.some(ft => ft.id === t.id))
        .map(t => ({
          id: t.id,
          title: t.title,
          authorityScope: t.authorityScope,
          description: t.description,
        })),
    }))
    .filter(p => p.tasks.length > 0);

  return {
    phases,
    filteredCount,
    totalCount,
  };
}

/**
 * Clear diagnostics cache
 */
export function clearDiagnosticsCache(): void {
  diagnosticsCache.clear();
  logger.info('Diagnostics cache cleared');
}

/**
 * Invalidate cache for a specific state
 */
export function invalidateStateCache(stateCode: string): void {
  for (const key of diagnosticsCache.keys()) {
    if (key.startsWith(`${stateCode}:`)) {
      diagnosticsCache.delete(key);
    }
  }
  logger.info({ stateCode }, 'Diagnostics cache invalidated for state');
}
