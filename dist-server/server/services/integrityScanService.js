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
// Cache for scan results (TTL: 10 minutes)
const scanCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;
// Default profiles to use if none provided
const DEFAULT_STATE_PROFILES = {};
// Load default profiles from fixtures
async function loadDefaultProfiles() {
    const SUPPORTED_STATES = ['CA', 'FL', 'GA', 'MA', 'MN', 'NJ', 'NY', 'OH', 'TX'];
    for (const stateCode of SUPPORTED_STATES) {
        try {
            const fixturePath = `./admin/integrity/fixtures/states/${stateCode.toLowerCase()}.json`;
            const profile = await import(fixturePath);
            DEFAULT_STATE_PROFILES[stateCode] = profile.default || profile;
        }
        catch (error) {
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
function getTasksForState(stateCode) {
    const tasks = [];
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
function filterTasksForProfile(tasks, profile) {
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
async function runStateProfileScan(stateCode, profile, options) {
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
export async function runFullScan(options = {}) {
    const startTime = Date.now();
    const SUPPORTED_STATES = options.stateCode ? [options.stateCode] : ['CA', 'FL', 'GA', 'MA', 'MN', 'NJ', 'NY', 'OH', 'TX'];
    const profilesToScan = options.profiles || SUPPORTED_STATES.flatMap(stateCode => {
        const defaultProfile = DEFAULT_STATE_PROFILES[stateCode];
        return defaultProfile ? [defaultProfile] : [];
    });
    if (profilesToScan.length === 0) {
        throw new Error('No profiles to scan. Provide profiles or ensure default fixtures exist.');
    }
    const allCheckResults = [];
    const allFindings = [];
    // Run scans for each profile
    for (const profile of profilesToScan) {
        const cacheKey = `${profile.stateCode}:${profile.id}`;
        // Check cache
        if (!options.skipCache) {
            const cached = scanCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
                logger.debug({ stateCode: profile.stateCode, profileId: profile.id }, 'Returning cached scan result');
                allCheckResults.push(...cached.report.checkResults);
                allFindings.push(...cached.report.checkResults.flatMap((r) => r.findings));
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
export async function runStateScan(stateCode, options = {}) {
    return runFullScan({ ...options, stateCode });
}
/**
 * Persist scan run to database
 */
export async function persistScanRun(report, triggeredBy, options = {}) {
    try {
        const summaryJson = {
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
            triggeredByUser: options.triggeredByUser,
            scanOptions: report.metadata.scanOptions,
            commitSha: options.commitSha,
            branchName: options.branchName,
            durationMs: report.metadata.totalExecutionTimeMs,
        };
        const record = await prisma.integrityScanRun.create({
            data: {
                environment: process.env.NODE_ENV || 'production',
                gitSha: options.commitSha || null,
                status: report.overallStatus === 'PASSED' ? 'PASSED' : 'FAILED',
                startedAt: report.metadata.startedAt ? new Date(report.metadata.startedAt) : new Date(),
                finishedAt: report.metadata.completedAt ? new Date(report.metadata.completedAt) : new Date(),
                createdBy: triggeredBy,
                summaryJson: summaryJson,
            },
        });
        // Persist findings
        for (const checkResult of report.checkResults) {
            for (const finding of checkResult.findings) {
                let mappedSeverity = 'INFO';
                if (['BLOCKER', 'HIGH', 'MED', 'LOW'].includes(finding.severity)) {
                    mappedSeverity = finding.severity;
                }
                else if (finding.severity === 'CRITICAL') {
                    mappedSeverity = 'BLOCKER';
                }
                else if (finding.severity === 'WARNING') {
                    mappedSeverity = 'HIGH';
                }
                await prisma.integrityFinding.create({
                    data: {
                        runId: record.id,
                        stateCode: finding.stateCode || 'GLOBAL',
                        countyName: null,
                        fixtureName: finding.checkName || 'UNKNOWN',
                        checkId: finding.checkId,
                        severity: mappedSeverity,
                        message: finding.message,
                        evidenceJson: { code: finding.code, taskId: finding.taskId, context: finding.context },
                        remediationHint: finding.suggestion,
                    },
                });
            }
        }
        return {
            id: record.id,
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
            scanOptions: report.metadata.scanOptions,
            commitSha: options.commitSha,
            branchName: options.branchName,
            durationMs: report.metadata.totalExecutionTimeMs,
            createdAt: record.startedAt.toISOString(),
            completedAt: record.finishedAt?.toISOString(),
        };
    }
    catch (error) {
        logger.error({ error }, 'Failed to persist scan run');
        throw error;
    }
}
/**
 * Get scan run details with findings
 */
export async function getScanRun(runId) {
    const run = await prisma.integrityScanRun.findUnique({
        where: { id: runId },
    });
    if (!run) {
        throw new Error(`Scan run not found: ${runId}`);
    }
    const findings = await prisma.integrityFinding.findMany({
        where: { runId: run.id },
        orderBy: { createdAt: 'desc' },
    });
    const summary = run.summaryJson || {};
    return {
        run: {
            id: run.id,
            stateCode: summary.stateCode,
            scanType: summary.scanType || 'FULL',
            overallStatus: summary.overallStatus || run.status,
            totalChecks: summary.totalChecks || 0,
            passedChecks: summary.passedChecks || 0,
            failedChecks: summary.failedChecks || 0,
            blockerCount: summary.blockerCount || 0,
            criticalCount: summary.criticalCount || 0,
            warningCount: summary.warningCount || 0,
            infoCount: summary.infoCount || 0,
            triggeredBy: run.createdBy || 'unknown',
            triggeredByUser: summary.triggeredByUser,
            scanOptions: summary.scanOptions,
            commitSha: run.gitSha || undefined,
            branchName: summary.branchName,
            durationMs: summary.durationMs || 0,
            createdAt: run.startedAt.toISOString(),
            completedAt: run.finishedAt?.toISOString(),
        },
        findings: findings.map(f => ({
            id: f.id,
            scanRunId: f.runId,
            checkId: f.checkId,
            checkName: f.fixtureName,
            stateCode: f.stateCode,
            severity: (f.severity === 'HIGH' ? 'WARNING' : f.severity),
            code: f.evidenceJson?.code || 'UNKNOWN',
            message: f.message,
            taskId: f.evidenceJson?.taskId,
            context: f.evidenceJson?.context,
            suggestion: f.remediationHint || undefined,
            createdAt: f.createdAt.toISOString(),
        })),
    };
}
/**
 * Get latest scan runs
 */
export async function getLatestScanRuns(limit = 20) {
    const runs = await prisma.integrityScanRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: limit,
    });
    return runs.map(run => {
        const summary = run.summaryJson || {};
        return {
            id: run.id,
            stateCode: summary.stateCode,
            scanType: summary.scanType || 'FULL',
            overallStatus: summary.overallStatus || run.status,
            totalChecks: summary.totalChecks || 0,
            passedChecks: summary.passedChecks || 0,
            failedChecks: summary.failedChecks || 0,
            blockerCount: summary.blockerCount || 0,
            criticalCount: summary.criticalCount || 0,
            warningCount: summary.warningCount || 0,
            infoCount: summary.infoCount || 0,
            triggeredBy: run.createdBy || 'unknown',
            triggeredByUser: summary.triggeredByUser,
            scanOptions: summary.scanOptions,
            commitSha: run.gitSha || undefined,
            branchName: summary.branchName,
            durationMs: summary.durationMs || 0,
            createdAt: run.startedAt.toISOString(),
            completedAt: run.finishedAt?.toISOString(),
        };
    });
}
/**
 * Get latest status for a state
 */
export async function getStateLatestStatus(stateCode) {
    const run = await prisma.integrityScanRun.findFirst({
        // We can't robustly filter by JSON inside stateCode perfectly in all PG versions without raw,
        // but we can query runs and filter since it's an admin endpoint.
        orderBy: { startedAt: 'desc' },
    });
    if (!run) {
        return null;
    }
    const summary = run.summaryJson || {};
    return {
        id: run.id,
        stateCode: summary.stateCode,
        scanType: summary.scanType || 'FULL',
        overallStatus: summary.overallStatus || run.status,
        totalChecks: summary.totalChecks || 0,
        passedChecks: summary.passedChecks || 0,
        failedChecks: summary.failedChecks || 0,
        blockerCount: summary.blockerCount || 0,
        criticalCount: summary.criticalCount || 0,
        warningCount: summary.warningCount || 0,
        infoCount: summary.infoCount || 0,
        triggeredBy: run.createdBy || 'unknown',
        triggeredByUser: summary.triggeredByUser,
        scanOptions: summary.scanOptions,
        commitSha: run.gitSha || undefined,
        branchName: summary.branchName,
        durationMs: summary.durationMs || 0,
        createdAt: run.startedAt.toISOString(),
        completedAt: run.finishedAt?.toISOString(),
    };
}
/**
 * Clear scan cache
 */
export function clearScanCache() {
    scanCache.clear();
    logger.info('Integrity scan cache cleared');
}
