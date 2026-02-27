/**
 * Jurisdiction Diagnostics Library
 *
 * Shared policy validators for the governance system.
 * Used by both CI Roadmap Compliance Harness and Admin Jurisdiction Health Dashboard.
 */
export * from './types.js';
// Policy validators
export { validateCrossStateStatuteLeak } from './policies/crossStateStatuteLeak.js';
export { validateAuthorityLeakage } from './policies/authorityLeakage.js';
export { validatePlaceholderIntegrity } from './policies/placeholderIntegrity.js';
export { validateStateBlacklist } from './policies/stateBlacklist.js';
export { validateStructuralInvariants } from './policies/structuralInvariants.js';
import { validateCrossStateStatuteLeak } from './policies/crossStateStatuteLeak.js';
import { validateAuthorityLeakage } from './policies/authorityLeakage.js';
import { validatePlaceholderIntegrity } from './policies/placeholderIntegrity.js';
import { validateStateBlacklist } from './policies/stateBlacklist.js';
import { validateStructuralInvariants } from './policies/structuralInvariants.js';
/**
 * All available policy validators
 */
export const ALL_POLICY_VALIDATORS = [
    validateCrossStateStatuteLeak,
    validateAuthorityLeakage,
    validatePlaceholderIntegrity,
    validateStateBlacklist,
    validateStructuralInvariants,
];
/**
 * Policy names for reference
 */
export const POLICY_NAMES = [
    'crossStateStatuteLeak',
    'authorityLeakage',
    'placeholderIntegrity',
    'stateBlacklist',
    'structuralInvariants',
];
/**
 * Run all policy validators against a set of tasks
 */
export async function runAllValidators(stateCode, estateProfile, tasks, options = {}) {
    const startTime = Date.now();
    // Filter validators based on options
    let validators = ALL_POLICY_VALIDATORS;
    if (options.includePolicies) {
        const includeSet = new Set(options.includePolicies);
        validators = validators.filter((_, index) => includeSet.has(POLICY_NAMES[index]));
    }
    if (options.excludePolicies) {
        const excludeSet = new Set(options.excludePolicies);
        validators = validators.filter((_, index) => !excludeSet.has(POLICY_NAMES[index]));
    }
    // Run all validators
    const policyResults = [];
    for (const validator of validators) {
        try {
            const result = await validator(stateCode, estateProfile, tasks);
            policyResults.push(result);
        }
        catch (error) {
            // Fail-closed: if a validator errors, treat it as a CRITICAL violation
            policyResults.push({
                passed: false,
                policyName: 'unknown',
                violations: [{
                        code: 'VALIDATOR_ERROR',
                        message: `Validator failed with error: ${error instanceof Error ? error.message : String(error)}`,
                        severity: 'CRITICAL',
                        context: { error: String(error) },
                    }],
                severityCounts: { CRITICAL: 1, WARNING: 0, INFO: 0 },
                executionTimeMs: 0,
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Calculate totals
    const totalViolations = {
        CRITICAL: policyResults.reduce((sum, r) => sum + r.severityCounts.CRITICAL, 0),
        WARNING: policyResults.reduce((sum, r) => sum + r.severityCounts.WARNING, 0),
        INFO: policyResults.reduce((sum, r) => sum + r.severityCounts.INFO, 0),
    };
    // Calculate health score
    const healthScore = calculateHealthScore(policyResults);
    return {
        stateCode,
        passed: totalViolations.CRITICAL === 0,
        policyResults,
        totalViolations,
        healthScore,
        metadata: {
            startedAt: new Date(startTime).toISOString(),
            completedAt: new Date().toISOString(),
            totalExecutionTimeMs: Date.now() - startTime,
            version: '1.0.0',
        },
    };
}
/**
 * Calculate health score from policy results
 *
 * Score formula:
 * - Start at 100
 * - Deduct 20 points per CRITICAL violation
 * - Deduct 5 points per WARNING violation
 * - Deduct 1 point per INFO violation
 * - Floor at 0
 */
export function calculateHealthScore(results) {
    let score = 100;
    for (const result of results) {
        score -= result.severityCounts.CRITICAL * 20;
        score -= result.severityCounts.WARNING * 5;
        score -= result.severityCounts.INFO * 1;
    }
    return Math.max(0, score);
}
/**
 * Get a single policy validator by name
 */
export function getPolicyValidator(name) {
    const index = POLICY_NAMES.indexOf(name);
    return index >= 0 ? ALL_POLICY_VALIDATORS[index] : undefined;
}
/**
 * Run a single policy validator by name
 */
export async function runPolicyValidator(name, stateCode, estateProfile, tasks) {
    const validator = getPolicyValidator(name);
    if (!validator)
        return null;
    try {
        return await validator(stateCode, estateProfile, tasks);
    }
    catch (error) {
        return {
            passed: false,
            policyName: name,
            violations: [{
                    code: 'VALIDATOR_ERROR',
                    message: `Validator "${name}" failed: ${error instanceof Error ? error.message : String(error)}`,
                    severity: 'CRITICAL',
                    context: { error: String(error) },
                }],
            severityCounts: { CRITICAL: 1, WARNING: 0, INFO: 0 },
            executionTimeMs: 0,
            timestamp: new Date().toISOString(),
        };
    }
}
