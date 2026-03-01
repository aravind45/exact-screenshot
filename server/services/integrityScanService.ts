/**
 * Integrity Scan Service
 * 
 * Server-side service for running integrity scans and managing scan results.
 * Used by the Admin Integrity Dashboard and CI/CD scripts.
 */

import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import { SETTLEMENT_PHASE_TASKS } from '../../src/config/settlementPhases.js';
import { filterTasksByJurisdiction, filterTasksByAuthorityScope } from '../../src/shared/filterByJurisdiction.js';
import { runAllIntegrityChecks, aggregateFindings, calculateOverallStatus } from '../../src/shared/integrityChecks/index.js';
import type {
  IntegrityScanReport,
  IntegrityScanOptions,
  EstateProfile,
  IntegrityScanRunRecord,
  IntegrityFindingRecord,
} from '../../src/shared/integrityChecks/types.js';
import type { DiagnosticTask } from '../../src/jurisdiction/diagnostics/types.js';

// Cache for scan results (TTL: 10 minutes)
const scanCache = new Map<string, { report: IntegrityScanReport; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

// Default profiles to use if none provided
const DEFAULT_STATE_PROFILES: Record<string, EstateProfile> = {};

// Load default profiles from fixtures
async function loadDefaultProfiles() {
  const SUPPORTED_STATES = ['CA', 'FL', 'GA', 'MA', 'MN', 'NJ', 'NY', 'OH', 'TX'];
  
  for (const stateCode of SUPPORTED_STATES) {
    try {
      const fixturePath = `./admin/integrity/fixtures/states/${stateCode.toLowerCase()}.json`;
      const profile = await import(fixturePath);
      DEFAULT_STATE_PROFILES[stateCode] = profile.default || profile;
    } catch (error) {
      logger.warn({ stateCode, error: String(error) }, 'Failed to load default profile for state');
    }
  }
}

// Initialize default profiles
loadDefaultProfiles().catch(err => {
  logger.error({ error: err }, 'Failed to load default integrity scan profiles');
});

/**
 * Get tasks for a state from the settlement phases config
 */
function getTasksForState(stateCode: string): DiagnosticTask[] {
  const tasks: DiagnosticTask[] = [];

  for (const phaseList of SETTLEMENT_PHASE_TASKS) {
    for (const task of phaseList.tasks) {
      tasks.push({
        id: task.id,
        title: task.title,
        description: task.description,
        scope: task.scope,
        authorityScope: task.authorityScope,
        allowedStates: task.allowedStates,
        allowedCounties: task.allowedCounties,
        applicability: task.applicability,
      });
    }
  }

  return tasks;
}

/**
 * Filter tasks for an estate profile
 */
function filterTasksForProfile(
  tasks: DiagnosticTask[],
  profile: EstateProfile
): DiagnosticTask[] {
  // First filter by jurisdiction (state)
  const jurisdictionResult = filterTasksByJurisdiction(tasks, profile.stateCode, profile.county);
  let filtered = jurisdictionResult.kept;

  // Then filter by authority scope
  const authorityResult = filterTasksByAuthorityScope(filtered, profile.authorityType);
  filtered = authorityResult.kept;

  return filtered;
}

/**
 * Run integrity scan for a single state/profile combination
 */
async function runStateProfileScan(
  stateCode: string,
  profile: EstateProfile,
  options: IntegrityScanOptions
): Promise<IntegrityScanReport> {
  const startTime = Date.now();

  // Get and filter tasks
  const allTasks = getTasksForState(stateCode);
  const filteredTasks = filterTasksForProfile(allTasks, profile);

  // Run all integrity checks
  const checkResults = await runAllIntegrityChecks(stateCode, profile, filteredTasks, options);

  // Calculate totals
  const totalFindings = aggregateFindings(checkResults);
  const overallStatus = calculateOverallStatus(checkResults);

  return {
    scanType: options.stateCode ? 'STATE' : 'CUSTOM',
    stateCode,
    overallStatus,
    totalChecks: checkResults.length,
    passedChecks: checkResults.filter(r => r.passed).length,
    failedChecks: checkResults.filter(r => !r.passed).length,
    checkResults,
    totalFindings,
    metadata: {
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      totalExecutionTimeMs: Date.now() - startTime,
      version: '1.0.0',
      scanOptions: options,
    },
  };
}

/**
 * Run a full integrity scan across all states
 */
export async function runFullScan(options: IntegrityScanOptions = {}): Promise<IntegrityScanReport> {
  const startTime = Date.now();
  const SUPPORTED_STATES = options.stateCode ? [options.stateCode] : ['CA', 'FL', 'GA', 'MA', 'MN', 'NJ', 'NY', 'OH', 'TX'];

  const profilesToScan = options.profiles || SUPPORTED_STATES.flatMap(stateCode => {
    const defaultProfile = DEFAULT_STATE_PROFILES[stateCode];
    return defaultProfile ? [defaultProfile] : [];
  });

  if (profilesToScan.length === 0) {
    throw new Error('No profiles to scan. Provide profiles or ensure default fixtures exist.');
  }

  const allCheckResults: any[] = [];
  const allFindings: any[] = [];

  // Run scans for each profile
  for (const profile of profilesToScan) {
    const cacheKey = `${profile.stateCode}:${profile.id}`;
    
    // Check cache
    if (!options.skipCache) {
      const cached = scanCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        logger.debug({ stateCode: profile.stateCode, profileId: profile.id }, 'Returning cached scan result');
        allCheckResults.push(...cached.report.checkResults);
        allFindings.push(...cached.report.checkResults.flatMap((r: any) => r.findings));
        continue;
      }
    }

    // Run scan
    const report = await runStateProfileScan(profile.stateCode, profile, options);
    
    // Cache result
    scanCache.set(cacheKey, { report, timestamp: Date.now() });

    allCheckResults.push(...report.checkResults);
    allFindings.push(...report.checkResults.flatMap(r => r.findings));
  }

  // Calculate overall results
  const totalFindings = aggregateFindings(allCheckResults);
  const overallStatus = calculateOverallStatus(allCheckResults);

  return {
    scanType: options.stateCode ? 'STATE' : 'FULL',
    stateCode: options.stateCode || undefined,
    overallStatus,
    totalChecks: allCheckResults.length,
    passedChecks: allCheckResults.filter(r => r.passed).length,
    failedChecks: allCheckResults.filter(r => !r.passed).length,
    checkResults: allCheckResults,
    totalFindings,
    metadata: {
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      totalExecutionTimeMs: Date.now() - startTime,
      version: '1.0.0',
      scanOptions: options,
    },
  };
}

/**
 * Run integrity scan for a single state
 */
export async function runStateScan(stateCode: string, options: IntegrityScanOptions = {}): Promise<IntegrityScanReport> {
  return runFullScan({ ...options, stateCode });
}

/**
 * Persist scan run to database
 */
export async function persistScanRun(
  report: IntegrityScanReport,
  triggeredBy: string,
  options: {
    triggeredByUser?: string;
    commitSha?: string;
    branchName?: string;
  } = {}
): Promise<IntegrityScanRunRecord> {
  try {
    const record = await prisma.integrityScanRun.create({
      data: {
        stateCode: report.stateCode,
        scanType: report.scanType,
        overallStatus: report.overallStatus,
        totalChecks: report.totalChecks,
        passedChecks: report.passedChecks,
        failedChecks: report.failedChecks,
        blockerCount: report.totalFindings.BLOCKER,
        criticalCount: report.totalFindings.CRITICAL,
        warningCount: report.totalFindings.WARNING,
        infoCount: report.totalFindings.INFO,
        triggeredBy,
        triggeredByUser: options.triggeredByUser,
        scanOptions: report.metadata.scanOptions as any,
        commitSha: options.commitSha,
        branchName: options.branchName,
        durationMs: report.metadata.totalExecutionTimeMs,
        completedAt: report.metadata.completedAt ? new Date(report.metadata.completedAt) : undefined,
      },
    });

    // Persist findings
    for (const checkResult of report.checkResults) {
      for (const finding of checkResult.findings) {
        await prisma.integrityFinding.create({
          data: {
            scanRunId: record.id,
            checkId: finding.checkId,
            checkName: finding.checkName,
            stateCode: finding.stateCode,
            severity: finding.severity as any,
            code: finding.code,
            message: finding.message,
            taskId: finding.taskId,
            context: finding.context as any,
            suggestion: finding.suggestion,
            remediation: finding.remediation as any,
          },
        });
      }
    }

    return {
      id: record.id,
      stateCode: record.stateCode || undefined,
      scanType: record.scanType as 'FULL' | 'STATE' | 'CUSTOM',
      overallStatus: record.overallStatus as 'PASSED' | 'FAILED' | 'IN_PROGRESS',
      totalChecks: record.totalChecks,
      passedChecks: record.passedChecks,
      failedChecks: record.failedChecks,
      blockerCount: record.blockerCount,
      criticalCount: record.criticalCount,
      warningCount: record.warningCount,
      infoCount: record.infoCount,
      triggeredBy: record.triggeredBy,
      triggeredByUser: record.triggeredByUser || undefined,
      scanOptions: record.scanOptions as Record<string, unknown> | undefined,
      commitSha: record.commitSha || undefined,
      branchName: record.branchName || undefined,
      durationMs: record.durationMs,
      errorMessage: record.errorMessage || undefined,
      createdAt: record.createdAt.toISOString(),
      completedAt: record.completedAt?.toISOString(),
    };
  } catch (error) {
    logger.error({ error }, 'Failed to persist scan run');
    throw error;
  }
}

/**
 * Get scan run details with findings
 */
export async function getScanRun(runId: string): Promise<{ run: IntegrityScanRunRecord; findings: IntegrityFindingRecord[] }> {
  const run = await prisma.integrityScanRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    throw new Error(`Scan run not found: ${runId}`);
  }

  const findings = await prisma.integrityFinding.findMany({
    where: { scanRunId: runId },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
  });

  return {
    run: {
      id: run.id,
      stateCode: run.stateCode || undefined,
      scanType: run.scanType as 'FULL' | 'STATE' | 'CUSTOM',
      overallStatus: run.overallStatus as 'PASSED' | 'FAILED' | 'IN_PROGRESS',
      totalChecks: run.totalChecks,
      passedChecks: run.passedChecks,
      failedChecks: run.failedChecks,
      blockerCount: run.blockerCount,
      criticalCount: run.criticalCount,
      warningCount: run.warningCount,
      infoCount: run.infoCount,
      triggeredBy: run.triggeredBy,
      triggeredByUser: run.triggeredByUser || undefined,
      scanOptions: run.scanOptions as Record<string, unknown> | undefined,
      commitSha: run.commitSha || undefined,
      branchName: run.branchName || undefined,
      durationMs: run.durationMs,
      errorMessage: run.errorMessage || undefined,
      createdAt: run.createdAt.toISOString(),
      completedAt: run.completedAt?.toISOString(),
    },
    findings: findings.map(f => ({
      id: f.id,
      scanRunId: f.scanRunId,
      checkId: f.checkId,
      checkName: f.checkName,
      stateCode: f.stateCode || undefined,
      severity: f.severity,
      code: f.code,
      message: f.message,
      taskId: f.taskId || undefined,
      context: f.context as Record<string, unknown> | undefined,
      suggestion: f.suggestion || undefined,
      remediation: f.remediation as Record<string, unknown> | undefined,
      createdAt: f.createdAt.toISOString(),
    })),
  };
}

/**
 * Get latest scan runs
 */
export async function getLatestScanRuns(limit: number = 20): Promise<IntegrityScanRunRecord[]> {
  const runs = await prisma.integrityScanRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return runs.map(run => ({
    id: run.id,
    stateCode: run.stateCode || undefined,
    scanType: run.scanType as 'FULL' | 'STATE' | 'CUSTOM',
    overallStatus: run.overallStatus as 'PASSED' | 'FAILED' | 'IN_PROGRESS',
    totalChecks: run.totalChecks,
    passedChecks: run.passedChecks,
    failedChecks: run.failedChecks,
    blockerCount: run.blockerCount,
    criticalCount: run.criticalCount,
    warningCount: run.warningCount,
    infoCount: run.infoCount,
    triggeredBy: run.triggeredBy,
    triggeredByUser: run.triggeredByUser || undefined,
    scanOptions: run.scanOptions as Record<string, unknown> | undefined,
    commitSha: run.commitSha || undefined,
    branchName: run.branchName || undefined,
    durationMs: run.durationMs,
    errorMessage: run.errorMessage || undefined,
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt?.toISOString(),
  }));
}

/**
 * Get latest status for a state
 */
export async function getStateLatestStatus(stateCode: string): Promise<IntegrityScanRunRecord | null> {
  const run = await prisma.integrityScanRun.findFirst({
    where: { stateCode },
    orderBy: { createdAt: 'desc' },
  });

  if (!run) {
    return null;
  }

  return {
    id: run.id,
    stateCode: run.stateCode || undefined,
    scanType: run.scanType as 'FULL' | 'STATE' | 'CUSTOM',
    overallStatus: run.overallStatus as 'PASSED' | 'FAILED' | 'IN_PROGRESS',
    totalChecks: run.totalChecks,
    passedChecks: run.passedChecks,
    failedChecks: run.failedChecks,
    blockerCount: run.blockerCount,
    criticalCount: run.criticalCount,
    warningCount: run.warningCount,
    infoCount: run.infoCount,
    triggeredBy: run.triggeredBy,
    triggeredByUser: run.triggeredByUser || undefined,
    scanOptions: run.scanOptions as Record<string, unknown> | undefined,
    commitSha: run.commitSha || undefined,
    branchName: run.branchName || undefined,
    durationMs: run.durationMs,
    errorMessage: run.errorMessage || undefined,
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt?.toISOString(),
  };
}

/**
 * Clear scan cache
 */
export function clearScanCache(): void {
  scanCache.clear();
  logger.info('Integrity scan cache cleared');
}
