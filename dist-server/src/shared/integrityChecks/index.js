/**
 * Integrity Checks Engine
 *
 * Main orchestration for all roadmap integrity checks.
 * Shared between CI, Admin Dashboard, and backend services.
 */
export * from './types.js';
import { validateCrossStateStatuteLeak } from './checks/crossStateStatuteLeak.js';
import { validateAuthorityScopeLeak } from './checks/authorityScopeLeak.js';
import { validatePlaceholderDetection } from './checks/placeholderDetection.js';
import { validateDbIntegrityInvariants } from './checks/dbIntegrityInvariants.js';
/**
 * All available integrity checks
 */
export const ALL_INTEGRITY_CHECKS = [
    {
        id: 'crossStateStatuteLeak',
        name: 'Cross-State Statute Leak',
        description: 'Detects when a state\'s roadmap contains statute citations from other states',
        check: validateCrossStateStatuteLeak,
    },
    {
        id: 'authorityScopeLeak',
        name: 'Authority Scope Leak',
        description: 'Detects PROBATE/TRUST task leakage - ensures tasks are scoped correctly',
        check: validateAuthorityScopeLeak,
    },
    {
        id: 'placeholderDetection',
        name: 'Placeholder Detection',
        description: 'Finds unresolved placeholders ({{ }}, TBD, etc.) in task content',
        check: validatePlaceholderDetection,
    },
    {
        id: 'dbIntegrityInvariants',
        name: 'Database Integrity Invariants',
        description: 'Validates database integrity - null authorityScope, duplicates, invalid scopes',
        check: validateDbIntegrityInvariants,
    },
];
/**
 * Check IDs for reference
 */
export const CHECK_IDS = ['crossStateStatuteLeak', 'authorityScopeLeak', 'placeholderDetection', 'dbIntegrityInvariants'];
/**
 * Convert diagnostic violations to integrity findings
 */
function convertViolationsToFindings(checkId, checkName, stateCode, violations) {
    return violations.map(v => {
        let severity = 'INFO';
        if (v.severity === 'CRITICAL')
            severity = 'CRITICAL';
        else if (v.severity === 'WARNING')
            severity = 'WARNING';
        return {
            checkId,
            checkName,
            stateCode,
            severity,
            code: v.code,
            message: v.message,
            taskId: v.taskId,
            context: v.context,
            suggestion: v.suggestion,
        };
    });
}
/**
 * Run a single integrity check
 */
export async function runIntegrityCheck(checkId, stateCode, estateProfile, tasks) {
    const checkDef = ALL_INTEGRITY_CHECKS.find(c => c.id === checkId);
    if (!checkDef) {
        return null;
    }
    const startTime = Date.now();
    try {
        // Run the check (may return DiagnosticResult or IntegrityCheckResult)
        const result = await checkDef.check(stateCode, estateProfile, tasks);
        // Normalize result format
        let findings;
        if ('findings' in result && Array.isArray(result.findings)) {
            // Already in IntegrityCheckResult format
            findings = result.findings;
        }
        else if ('violations' in result && Array.isArray(result.violations)) {
            // Convert from DiagnosticResult format
            findings = convertViolationsToFindings(checkId, checkDef.name, stateCode, result.violations);
        }
        else {
            findings = [];
        }
        // Calculate severity counts
        const severityCounts = findings.reduce((acc, f) => {
            acc[f.severity]++;
            return acc;
        }, { BLOCKER: 0, CRITICAL: 0, WARNING: 0, INFO: 0 });
        return {
            passed: severityCounts.BLOCKER === 0 && severityCounts.CRITICAL === 0,
            checkId,
            checkName: checkDef.name,
            findings,
            severityCounts,
            executionTimeMs: Date.now() - startTime,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        // Fail-closed: if a check errors, treat it as BLOCKER
        return {
            passed: false,
            checkId,
            checkName: checkDef.name,
            findings: [
                {
                    checkId,
                    checkName: checkDef.name,
                    stateCode,
                    severity: 'BLOCKER',
                    code: 'CHECK_ERROR',
                    message: `Check failed with error: ${error instanceof Error ? error.message : String(error)}`,
                    context: { error: String(error) },
                    suggestion: 'Check the check implementation for errors',
                },
            ],
            severityCounts: { BLOCKER: 1, CRITICAL: 0, WARNING: 0, INFO: 0 },
            executionTimeMs: Date.now() - startTime,
            timestamp: new Date().toISOString(),
        };
    }
}
/**
 * Run all integrity checks for a state/profile combination
 */
export async function runAllIntegrityChecks(stateCode, estateProfile, tasks, options = {}) {
    let checksToRun = ALL_INTEGRITY_CHECKS;
    // Filter checks if specified
    if (options.checkIds && options.checkIds.length > 0) {
        checksToRun = checksToRun.filter(c => options.checkIds.includes(c.id));
    }
    const results = [];
    // Run checks sequentially (for now, could parallelize later)
    for (const checkDef of checksToRun) {
        const timeoutMs = options.timeoutMs || 30000; // 30 second default timeout
        try {
            // Run with timeout
            const result = await Promise.race([
                runIntegrityCheck(checkDef.id, stateCode, estateProfile, tasks),
                new Promise((_, reject) => setTimeout(() => reject(new Error(`Check "${checkDef.id}" timed out after ${timeoutMs}ms`)), timeoutMs)),
            ]);
            if (result) {
                results.push(result);
            }
        }
        catch (error) {
            // Error is handled by runIntegrityCheck (fail-closed)
            const failedResult = await runIntegrityCheck(checkDef.id, stateCode, estateProfile, tasks);
            if (failedResult) {
                results.push(failedResult);
            }
        }
    }
    return results;
}
/**
 * Calculate overall scan status from check results
 */
export function calculateOverallStatus(results) {
    const hasBlockers = results.some(r => r.severityCounts.BLOCKER > 0);
    const hasCritical = results.some(r => r.severityCounts.CRITICAL > 0);
    if (hasBlockers || hasCritical) {
        return 'FAILED';
    }
    return 'PASSED';
}
/**
 * Aggregate findings from all check results
 */
export function aggregateFindings(results) {
    const totalFindings = results.reduce((acc, r) => {
        acc.BLOCKER += r.severityCounts.BLOCKER;
        acc.CRITICAL += r.severityCounts.CRITICAL;
        acc.WARNING += r.severityCounts.WARNING;
        acc.INFO += r.severityCounts.INFO;
        return acc;
    }, { BLOCKER: 0, CRITICAL: 0, WARNING: 0, INFO: 0 });
    return totalFindings;
}
/**
 * Get a single integrity check by ID
 */
export function getIntegrityCheck(checkId) {
    const checkDef = ALL_INTEGRITY_CHECKS.find(c => c.id === checkId);
    return checkDef?.check || null;
}
