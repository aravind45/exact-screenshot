/**
 * Authority Leakage Policy Validator
 * 
 * Ensures PROBATE estates don't see TRUST tasks and vice versa.
 * This is the root-cause filter that prevents trust/probate module leakage.
 * 
 * Uses fail-closed approach: tasks without authorityScope default to BOTH (backward compatible)
 * but unknown scope values are dropped.
 */

import type { DiagnosticResult, EstateProfile, DiagnosticTask, Violation } from "../types";

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
 * Determines if a task's authorityScope is compatible with the estate's authority type
 */
function isTaskCompatible(
  taskScope: string | undefined,
  estateAuthorityType: string
): { compatible: boolean; reason?: string } {
  // Tasks without authorityScope default to BOTH (backward compatibility)
  if (!taskScope) {
    return { compatible: true };
  }

  // Validate scope value
  if (!isValidAuthorityScope(taskScope)) {
    return {
      compatible: false,
      reason: `Invalid authorityScope "${taskScope}" - must be PROBATE, TRUST, or BOTH`,
    };
  }

  // BOTH tasks are always visible
  if (taskScope === 'BOTH') {
    return { compatible: true };
  }

  // Estate is BOTH: show all tasks
  if (estateAuthorityType === 'BOTH') {
    return { compatible: true };
  }

  // Exact match required for PROBATE or TRUST
  if (taskScope === estateAuthorityType) {
    return { compatible: true };
  }

  // Mismatch
  return {
    compatible: false,
    reason: `authorityScope "${taskScope}" does not match estateAuthorityType "${estateAuthorityType}"`,
  };
}

/**
 * Validates authority scope compatibility for all tasks
 */
export function validateAuthorityLeakage(
  _stateCode: string,
  estateProfile: EstateProfile,
  tasks: DiagnosticTask[]
): DiagnosticResult {
  const startTime = Date.now();
  const violations: Violation[] = [];

  const estateAuthorityType = estateProfile.authorityType;

  for (const task of tasks) {
    const compatibility = isTaskCompatible(task.authorityScope, estateAuthorityType);

    if (!compatibility.compatible) {
      violations.push({
        code: 'AUTHORITY_SCOPE_LEAKAGE',
        message: `Task "${task.title}" (${task.id}) would be visible to ${estateAuthorityType} estate but has ${task.authorityScope || 'undefined'} scope`,
        severity: 'CRITICAL',
        taskId: task.id,
        context: {
          taskAuthorityScope: task.authorityScope || 'undefined (defaults to BOTH)',
          estateAuthorityType,
          reason: compatibility.reason,
        },
        suggestion: task.authorityScope === undefined
          ? 'Add explicit authorityScope property to the task'
          : `Change authorityScope to "BOTH" or match estate type "${estateAuthorityType}"`,
      });
    }

    // Additional check: TRUST-scope tasks should not have probate-specific language
    if (task.authorityScope === 'TRUST' && estateAuthorityType === 'TRUST') {
      const probateTerms = ['probate court', 'probate petition', 'letters testamentary', 'personal representative'];
      const description = (task.description || '').toLowerCase();
      
      for (const term of probateTerms) {
        if (description.includes(term)) {
          violations.push({
            code: 'TRUST_TASK_PROBATE_LANGUAGE',
            message: `TRUST-scope task "${task.title}" contains probate terminology "${term}"`,
            severity: 'WARNING',
            taskId: task.id,
            context: {
              foundTerm: term,
              field: 'description',
            },
            suggestion: 'Replace probate terminology with trust-appropriate language (e.g., "trust administration", "successor trustee")',
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
          violations.push({
            code: 'PROBATE_TASK_TRUST_LANGUAGE',
            message: `PROBATE-scope task "${task.title}" contains trust terminology "${term}"`,
            severity: 'WARNING',
            taskId: task.id,
            context: {
              foundTerm: term,
              field: 'description',
            },
            suggestion: 'Ensure trust references are appropriate for probate context or move to TRUST scope',
          });
        }
      }
    }
  }

  // Check for missing critical authority-scoped tasks
  const hasAuthorityScopedTasks = tasks.some(t => t.authorityScope === estateAuthorityType || t.authorityScope === 'BOTH');
  
  if (!hasAuthorityScopedTasks && tasks.length > 0) {
    violations.push({
      code: 'MISSING_AUTHORITY_SCOPED_TASKS',
      message: `No tasks have authorityScope matching estate type "${estateAuthorityType}"`,
      severity: 'WARNING',
      context: {
        estateAuthorityType,
        totalTasks: tasks.length,
        tasksWithScope: tasks.filter(t => t.authorityScope).length,
      },
      suggestion: 'Ensure tasks relevant to this authority type have appropriate authorityScope set',
    });
  }

  const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length;
  const warningCount = violations.filter(v => v.severity === 'WARNING').length;
  const infoCount = violations.filter(v => v.severity === 'INFO').length;

  return {
    passed: violations.filter(v => v.severity === 'CRITICAL').length === 0,
    policyName: 'authorityLeakage',
    violations,
    severityCounts: {
      CRITICAL: criticalCount,
      WARNING: warningCount,
      INFO: infoCount,
    },
    executionTimeMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}
