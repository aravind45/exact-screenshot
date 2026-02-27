/**
 * State Blacklist Policy Validator
 * 
 * Enforces state-specific blacklists of tasks/concepts that should not appear.
 * For example, Ohio shouldn't have "Spousal Property Petition" (a California concept).
 * 
 * Each state can have:
 * - Forbidden task IDs (should never appear)
 * - Forbidden terms (concepts that don't exist in the state)
 * - Required task IDs (must be present for the state)
 */

import type { DiagnosticResult, EstateProfile, DiagnosticTask, Violation } from "../types.js";

/**
 * State-specific blacklist configuration
 */
interface StateBlacklistConfig {
  /** Task IDs that should NOT appear for this state */
  forbiddenTaskIds: string[];
  /** Terms that should not appear in task content */
  forbiddenTerms: Array<{
    term: string;
    reason: string;
    severity: 'CRITICAL' | 'WARNING';
  }>;
  /** Task IDs that MUST be present for this state */
  requiredTaskIds: string[];
  /** State-specific concepts that should be present */
  expectedConcepts: Array<{
    term: string;
    description: string;
    severity: 'CRITICAL' | 'WARNING';
  }>;
}

/**
 * State blacklist configurations
 */
const STATE_BLACKLISTS: Record<string, StateBlacklistConfig> = {
  'OH': {
    forbiddenTaskIds: [
      'file_spousal_property_petition', // California-specific
      'file_petition_for_probate_ca',   // California form
      'file_de131',                      // California DE-131 form
      'file_de150',                      // California DE-150 form
    ],
    forbiddenTerms: [
      { term: 'spousal property petition', reason: 'California-specific procedure (Probate Code 13500)', severity: 'CRITICAL' },
      { term: 'DE-131', reason: 'California Judicial Council form', severity: 'CRITICAL' },
      { term: 'DE-150', reason: 'California Judicial Council form', severity: 'CRITICAL' },
      { term: 'probate referee', reason: 'California-specific role; Ohio uses "appraiser"', severity: 'WARNING' },
      { term: 'inventory and appraisal', reason: 'California form title; Ohio uses different terminology', severity: 'WARNING' },
      { term: 'I\u0026A', reason: 'California abbreviation for Inventory and Appraisal', severity: 'WARNING' },
    ],
    requiredTaskIds: [],
    expectedConcepts: [
      { term: 'certificate of transfer', description: 'Ohio-specific transfer mechanism', severity: 'WARNING' },
      { term: 'release from administration', description: 'Ohio small estate process', severity: 'WARNING' },
    ],
  },
  'CA': {
    forbiddenTaskIds: [
      'file_release_from_administration', // Ohio-specific
      'file_certificate_of_transfer',     // Ohio-specific
    ],
    forbiddenTerms: [
      { term: 'release from administration', reason: 'Ohio-specific small estate procedure', severity: 'CRITICAL' },
      { term: 'certificate of transfer', reason: 'Ohio-specific real property transfer', severity: 'CRITICAL' },
      { term: 'survivorship tenancy', reason: 'Term more common in Ohio; California uses different concepts', severity: 'WARNING' },
    ],
    requiredTaskIds: [],
    expectedConcepts: [
      { term: 'spousal property petition', description: 'California Probate Code 13500 procedure', severity: 'WARNING' },
      { term: 'probate referee', description: 'California court-appointed appraiser', severity: 'WARNING' },
    ],
  },
  'NY': {
    forbiddenTaskIds: [
      'file_spousal_property_petition', // California-specific
      'file_release_from_administration', // Ohio-specific
    ],
    forbiddenTerms: [
      { term: 'spousal property petition', reason: 'California-specific procedure', severity: 'CRITICAL' },
      { term: 'release from administration', reason: 'Ohio-specific procedure', severity: 'CRITICAL' },
      { term: 'certificate of transfer', reason: 'Ohio-specific procedure', severity: 'CRITICAL' },
    ],
    requiredTaskIds: [],
    expectedConcepts: [
      { term: 'voluntary administration', description: 'New York small estate process', severity: 'WARNING' },
      { term: 'affidavit of voluntary administration', description: 'New York small estate form', severity: 'WARNING' },
    ],
  },
  'TX': {
    forbiddenTaskIds: [
      'file_spousal_property_petition', // California-specific
      'file_release_from_administration', // Ohio-specific
    ],
    forbiddenTerms: [
      { term: 'spousal property petition', reason: 'California-specific procedure', severity: 'CRITICAL' },
      { term: 'release from administration', reason: 'Ohio-specific procedure', severity: 'CRITICAL' },
    ],
    requiredTaskIds: [],
    expectedConcepts: [
      { term: 'muniment of title', description: 'Texas unique probate procedure', severity: 'WARNING' },
      { term: 'small estate affidavit', description: 'Texas small estate process (different from other states)', severity: 'WARNING' },
    ],
  },
  'FL': {
    forbiddenTaskIds: [
      'file_spousal_property_petition', // California-specific
      'file_release_from_administration', // Ohio-specific
    ],
    forbiddenTerms: [
      { term: 'spousal property petition', reason: 'California-specific procedure', severity: 'CRITICAL' },
      { term: 'release from administration', reason: 'Ohio-specific procedure', severity: 'CRITICAL' },
    ],
    requiredTaskIds: [],
    expectedConcepts: [
      { term: 'summary administration', description: 'Florida small estate process', severity: 'WARNING' },
      { term: 'curator', description: 'Florida-specific estate administrator role', severity: 'WARNING' },
    ],
  },
};

/**
 * Validates state-specific blacklists
 */
export function validateStateBlacklist(
  stateCode: string,
  _estateProfile: EstateProfile,
  tasks: DiagnosticTask[]
): DiagnosticResult {
  const startTime = Date.now();
  const violations: Violation[] = [];

  const config = STATE_BLACKLISTS[stateCode];
  
  // If no config for this state, skip with INFO
  if (!config) {
    return {
      passed: true,
      policyName: 'stateBlacklist',
      violations: [{
        code: 'NO_BLACKLIST_CONFIG',
        message: `No blacklist configuration found for state ${stateCode}`,
        severity: 'INFO',
        context: { stateCode },
        suggestion: `Consider adding blacklist configuration for ${stateCode}`,
      }],
      severityCounts: { CRITICAL: 0, WARNING: 0, INFO: 1 },
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const allTaskText = tasks.map(t => `${t.title} ${t.description || ''}`).join(' ').toLowerCase();

  // Check forbidden task IDs
  for (const forbiddenId of config.forbiddenTaskIds) {
    if (taskMap.has(forbiddenId)) {
      const task = taskMap.get(forbiddenId)!;
      violations.push({
        code: 'FORBIDDEN_TASK_ID',
        message: `Task "${task.title}" (${forbiddenId}) is blacklisted for ${stateCode}`,
        severity: 'CRITICAL',
        taskId: forbiddenId,
        context: {
          forbiddenId,
          stateCode,
        },
        suggestion: 'Remove task or verify it belongs to a different state',
      });
    }
  }

  // Check forbidden terms
  for (const { term, reason, severity } of config.forbiddenTerms) {
    const termLower = term.toLowerCase();
    
    for (const task of tasks) {
      const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
      
      if (taskText.includes(termLower)) {
        violations.push({
          code: 'FORBIDDEN_TERM',
          message: `Task "${task.title}" contains blacklisted term "${term}" for ${stateCode}`,
          severity,
          taskId: task.id,
          context: {
            term,
            stateCode,
            reason,
          },
          suggestion: reason,
        });
      }
    }
  }

  // Check required task IDs
  for (const requiredId of config.requiredTaskIds) {
    if (!taskMap.has(requiredId)) {
      violations.push({
        code: 'MISSING_REQUIRED_TASK',
        message: `Required task "${requiredId}" is missing for ${stateCode}`,
        severity: 'WARNING',
        context: {
          requiredId,
          stateCode,
        },
        suggestion: `Add required task ${requiredId} for ${stateCode}`,
      });
    }
  }

  // Check expected concepts (info level only)
  for (const { term, description, severity } of config.expectedConcepts) {
    const termLower = term.toLowerCase();
    const foundInTasks = tasks.some(t => 
      `${t.title} ${t.description || ''}`.toLowerCase().includes(termLower)
    );
    
    if (!foundInTasks) {
      violations.push({
        code: 'MISSING_EXPECTED_CONCEPT',
        message: `Expected concept "${term}" not found in ${stateCode} tasks`,
        severity,
        context: {
          term,
          stateCode,
          description,
        },
        suggestion: `Consider adding task with ${term} concept`,
      });
    }
  }

  const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length;
  const warningCount = violations.filter(v => v.severity === 'WARNING').length;
  const infoCount = violations.filter(v => v.severity === 'INFO').length;

  return {
    passed: criticalCount === 0,
    policyName: 'stateBlacklist',
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
