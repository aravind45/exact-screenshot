/**
 * Authority Scope Leak Integrity Check
 *
 * Ensures PROBATE estates don't see TRUST tasks and vice versa.
 * This is root-cause filter that prevents trust/probate module leakage.
 *
 * Fail-closed: tasks without authorityScope are treated as violations,
 * and unknown scope values are also violations.
 */

import type { IntegrityCheckResult, IntegrityFinding } from '../types.js';
import type { EstateProfile, DiagnosticTask } from '../../../jurisdiction/diagnostics/types.js';

// Valid authority scopes
const VALID_AUTHORITY_SCOPES = ['PROBATE', 'TRUST', 'BOTH'] as const;

type ValidAuthorityScope = typeof VALID_AUTHORITY_SCOPES[number];

/**
 * Checks if a scope value is valid
 */
function isValidAuthorityScope(scope: string | undefined): scope is ValidAuthorityScope {
  if (!scope) return false;
  return VALID_AUTHORITY_SCOPES.includes(scope as ValidAuthorityScope);
}

/**
 * Determines if a task's authorityScope is compatible with estate's authority type.
 * Fail-closed: tasks without authorityScope are NOT compatible.
 */
function isTaskCompatible(
  taskScope: string | undefined,
  estateAuthorityType: string
): { compatible: boolean; reason?: string } {
  if (!taskScope) {
    return {
      compatible: false,
      reason: `authorityScope is missing — task must have explicit PROBATE, TRUST, or BOTH scope (FAIL-CLOSED)`,
    };
  }

  if (!isValidAuthorityScope(taskScope)) {
    return {
      compatible: false,
      reason: `Invalid authorityScope "${taskScope}" - must be PROBATE, TRUST, or BOTH`,
    };
  }

  if (taskScope === 'BOTH') {
    return { compatible: true };
  }

  if (estateAuthorityType === 'BOTH') {
    return { compatible: true };
  }

  if (taskScope === estateAuthorityType) {
    return { compatible: true };
  }

  return {
    compatible: false,
    reason: `authorityScope "${taskScope}" does not match estateAuthorityType "${estateAuthorityType}"`,
  };
}

/**
 * Validates authority scope compatibility for all tasks
 */
export function validateAuthorityScopeLeak(
  _stateCode: string,
  estateProfile: EstateProfile,
  tasks: DiagnosticTask[]
): IntegrityCheckResult {
  const startTime = Date.now();
  const findings: IntegrityFinding[] = [];

  const estateAuthorityType = estateProfile.authorityType;

  for (const task of tasks) {
    const compatibility = isTaskCompatible(task.authorityScope, estateAuthorityType);

    if (!compatibility.compatible) {
      findings.push({
        checkId: 'authorityScopeLeak',
        checkName: 'Authority Scope Leak',
        stateCode: _stateCode,
        severity: 'BLOCKER',
        code: 'AUTHORITY_SCOPE_LEAKAGE',
        message: `Task "${task.title}" (${task.id}) would be visible to ${estateAuthorityType} estate but has ${task.authorityScope || 'undefined'} scope`,
        taskId: task.id,
        context: {
          taskAuthorityScope: task.authorityScope || 'undefined (defaults to BOTH)',
          estateAuthorityType,
          reason: compatibility.reason,
        },
        suggestion: task.authorityScope === undefined
          ? 'Add explicit authorityScope: "PROBATE" | "TRUST" | "BOTH" to task (required)'
          : `Change authorityScope to "BOTH" or match estate type "${estateAuthorityType}"`,
        remediation: {
          type: 'code',
          steps: [
            `Locate task "${task.title}" in settlementPhases.ts`,
            `Add or update authorityScope field`,
            `Set to "${estateAuthorityType}" if task only applies to that authority type`,
            `Set to "BOTH" if task applies to both PROBATE and TRUST`,
          ],
        },
      });
    }

    // Additional check: TRUST-scope tasks should not have probate-specific language
    if (task.authorityScope === 'TRUST' && estateAuthorityType === 'TRUST') {
      const probateTerms = ['probate court', 'probate petition', 'letters testamentary', 'personal representative'];
      const description = (task.description || '').toLowerCase();
      
      for (const term of probateTerms) {
        if (description.includes(term)) {
          findings.push({
            checkId: 'authorityScopeLeak',
            checkName: 'Authority Scope Leak',
            stateCode: _stateCode,
            severity: 'WARNING',
            code: 'TRUST_TASK_PROBATE_LANGUAGE',
            message: `TRUST-scope task "${task.title}" contains probate terminology "${term}"`,
            taskId: task.id,
            context: {
              foundTerm: term,
              field: 'description',
            },
            suggestion: 'Replace probate terminology with trust-appropriate language (e.g., "trust administration", "successor trustee")',
            remediation: {
              type: 'content',
              steps: [
                `Review task "${task.title}" description`,
                `Replace "${term}" with trust-appropriate terminology`,
                `Consider if this task should have authorityScope="PROBATE" instead`,
              ],
            },
          });
        }
      }
    }

    // Check for trust terms in PROBATE tasks
    if (task.authorityScope === 'PROBATE' && estateAuthorityType === 'PROBATE') {
      const trustTerms = ['successor trustee', 'trust document', 'trustee duties', 'irrevocable trust'];
      const description = (task.description || '').toLowerCase();
      
      for (const term of trustTerms) {
        if (description.includes(term)) {
          findings.push({
            checkId: 'authorityScopeLeak',
            checkName: 'Authority Scope Leak',
            stateCode: _stateCode,
            severity: 'WARNING',
            code: 'PROBATE_TASK_TRUST_LANGUAGE',
            message: `PROBATE-scope task "${task.title}" contains trust terminology "${term}"`,
            taskId: task.id,
            context: {
              foundTerm: term,
              field: 'description',
            },
            suggestion: 'Ensure trust references are appropriate for probate context or move to TRUST scope',
            remediation: {
              type: 'content',
              steps: [
                `Review task "${task.title}" description`,
                `Verify "${term}" is appropriate in probate context`,
                `Consider if this task should have authorityScope="TRUST" instead`,
              ],
            },
          });
        }
      }
    }
  }

  // Check for missing critical authority-scoped tasks
  const hasAuthorityScopedTasks = tasks.some(t => t.authorityScope === estateAuthorityType || t.authorityScope === 'BOTH');
  
  if (!hasAuthorityScopedTasks && tasks.length > 0) {
    findings.push({
      checkId: 'authorityScopeLeak',
      checkName: 'Authority Scope Leak',
      stateCode: _stateCode,
      severity: 'WARNING',
      code: 'MISSING_AUTHORITY_SCOPED_TASKS',
      message: `No tasks have authorityScope matching estate type "${estateAuthorityType}"`,
      context: {
        estateAuthorityType,
        totalTasks: tasks.length,
        tasksWithScope: tasks.filter(t => t.authorityScope).length,
      },
      suggestion: 'Ensure tasks relevant to this authority type have appropriate authorityScope set',
      remediation: {
        type: 'code',
        steps: [
          `Review all tasks for state ${_stateCode}`,
          `Add authorityScope field to relevant tasks`,
          `Set to "${estateAuthorityType}" for probate-only tasks`,
          `Set to "TRUST" for trust-only tasks`,
          `Set to "BOTH" for tasks that apply to both`,
        ],
      },
    });
  }

  const severityCounts = findings.reduce(
    (acc, f) => {
      acc[f.severity]++;
      return acc;
    },
    { BLOCKER: 0, CRITICAL: 0, WARNING: 0, INFO: 0 }
  );

  return {
    passed: findings.filter(f => f.severity === 'BLOCKER').length === 0,
    checkId: 'authorityScopeLeak',
    checkName: 'Authority Scope Leak',
    findings,
    severityCounts,
    executionTimeMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}
