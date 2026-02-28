/**
 * Diagnostics Types
 * Shared types for the governance system - used by both CI harness and Admin Dashboard
 */

import type { AuthorityScope } from "../../types/authorityScope.js";

/**
 * Severity levels for diagnostic violations
 */
export type ViolationSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

/**
 * Single violation found by a policy validator
 */
export interface Violation {
  /** Unique identifier for the violation type */
  code: string;
  /** Human-readable description */
  message: string;
  /** Severity level */
  severity: ViolationSeverity;
  /** Task or entity ID where violation was found */
  taskId?: string;
  /** Additional context for debugging */
  context?: Record<string, unknown>;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Result from a single policy validator
 */
export interface DiagnosticResult {
  /** Whether the policy passed */
  passed: boolean;
  /** Policy name */
  policyName: string;
  /** List of violations found */
  violations: Violation[];
  /** Count by severity */
  severityCounts: {
    CRITICAL: number;
    WARNING: number;
    INFO: number;
  };
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Timestamp of the run */
  timestamp: string;
}

/**
 * Complete diagnostic report for a jurisdiction/state
 */
export interface JurisdictionDiagnosticReport {
  /** State code (e.g., 'CA', 'NY') */
  stateCode: string;
  /** Overall pass/fail status */
  passed: boolean;
  /** Results from each policy validator */
  policyResults: DiagnosticResult[];
  /** Total violations by severity */
  totalViolations: {
    CRITICAL: number;
    WARNING: number;
    INFO: number;
  };
  /** Health score (0-100) */
  healthScore: number;
  /** Execution metadata */
  metadata: {
    startedAt: string;
    completedAt: string;
    totalExecutionTimeMs: number;
    version: string;
  };
}

/**
 * Estate profile used for testing roadmaps
 */
export interface EstateProfile {
  /** Unique identifier for the fixture */
  id: string;
  /** Descriptive name */
  name: string;
  /** State code */
  stateCode: string;
  /** County name */
  county?: string;
  /** Estate authority type */
  authorityType: 'PROBATE' | 'TRUST' | 'BOTH';
  /** Whether estate has real property */
  hasRealProperty: boolean;
  /** Estimated estate value */
  estateValue: number;
  /** Whether there's a will */
  hasWill: boolean;
  /** Additional characteristics */
  characteristics: {
    isSmallEstate?: boolean;
    hasMinorBeneficiaries?: boolean;
    hasContest?: boolean;
    isInternational?: boolean;
    hasTODDeed?: boolean;
    hasOutOfStateProperty?: boolean;
    isSurvivingSpouse?: boolean;
    [key: string]: unknown;
  };
}

/**
 * Task shape for diagnostic processing
 */
export interface DiagnosticTask {
  id: string;
  title?: string;
  description?: string;
  scope?: string;
  authorityScope?: AuthorityScope;
  allowedStates?: string[];
  allowedCounties?: string[];
  applicability?: {
    states?: string[];
    [key: string]: unknown;
  };
  trackCompatibility?: string[];
  stateOverrides?: Record<string, unknown>;
  formNames?: string[];
  primaryActionUrl?: string;
  links?: Array<{ label: string; url: string }>;
  tags?: string[];
  dependencies?: string[];
}

/**
 * Snapshot entry for a task
 */
export interface TaskSnapshot {
  id: string;
  title: string;
  phase: string;
  phaseOrder: number;
  taskOrder: number;
  authorityScope?: AuthorityScope;
  scope: string;
  hash: string;
}

/**
 * Snapshot for an estate profile
 */
export interface EstateSnapshot {
  /** Estate profile ID */
  profileId: string;
  /** State code */
  stateCode: string;
  /** Authority type */
  authorityType: string;
  /** Tasks in the roadmap */
  tasks: TaskSnapshot[];
  /** Total task count */
  taskCount: number;
  /** Phase count */
  phaseCount: number;
  /** Hash of entire snapshot */
  hash: string;
  /** Generation timestamp */
  generatedAt: string;
  /** Schema version */
  version: string;
}

/**
 * Snapshot diff result
 */
export interface SnapshotDiff {
  /** Estate profile ID */
  profileId: string;
  /** Whether snapshots match */
  matches: boolean;
  /** Tasks added in new snapshot */
  added: TaskSnapshot[];
  /** Tasks removed in new snapshot */
  removed: TaskSnapshot[];
  /** Tasks modified */
  modified: Array<{
    taskId: string;
    previous: Partial<TaskSnapshot>;
    current: Partial<TaskSnapshot>;
    changes: string[];
  }>;
  /** Task order changes */
  orderChanges: Array<{
    taskId: string;
    previousOrder: number;
    currentOrder: number;
  }>;
}

/**
 * Policy validator function signature
 */
export type PolicyValidator = (
  stateCode: string,
  estateProfile: EstateProfile,
  tasks: DiagnosticTask[]
) => DiagnosticResult | Promise<DiagnosticResult>;

/**
 * County override with approval status
 */
export interface CountyOverrideWithApproval {
  id: string;
  stateCode: string;
  countyName: string;
  taskId: string;
  title?: string;
  description?: string;
  feeAmount?: number;
  primaryActionUrl?: string;
  formNames: string[];
  attachments?: Array<{ label: string; url: string }>;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Diagnostic run record (for database storage)
 */
export interface DiagnosticRunRecord {
  id: string;
  stateCode: string;
  overallStatus: 'PASS' | 'FAIL';
  healthScore: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  resultsJson: Record<string, unknown>;
  triggeredBy: string;
  commitSha?: string;
  branchName?: string;
  durationMs: number;
  createdAt: string;
}

/**
 * Health trend data point
 */
export interface HealthTrendPoint {
  timestamp: string;
  healthScore: number;
  criticalCount: number;
  warningCount: number;
}

/**
 * Jurisdiction health summary
 */
export interface JurisdictionHealthSummary {
  stateCode: string;
  stateName: string;
  healthScore: number;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  lastDiagnosticRun: string;
  totalViolations: number;
  criticalViolations: number;
  pendingOverrides: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}
