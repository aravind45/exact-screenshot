/**
 * Integrity Checks Types
 * 
 * Shared types for the integrity verification system.
 * Used by CI, Admin Dashboard, and backend services.
 */

import type { EstateProfile, DiagnosticTask } from '../../jurisdiction/diagnostics/types.js';

// Re-export types used by integrity checks
export type { EstateProfile, DiagnosticTask } from '../../jurisdiction/diagnostics/types.js';

/**
 * Severity levels for integrity findings
 */
export type FindingSeverity = 'BLOCKER' | 'CRITICAL' | 'WARNING' | 'INFO';

/**
 * Single finding from an integrity check
 */
export interface IntegrityFinding {
  /** Check ID that produced this finding */
  checkId: string;
  /** Human-readable check name */
  checkName: string;
  /** State code (if state-specific) */
  stateCode?: string;
  /** Severity level */
  severity: FindingSeverity;
  /** Unique violation code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Task ID (if applicable) */
  taskId?: string;
  /** Additional context */
  context?: Record<string, unknown>;
  /** Suggested fix */
  suggestion?: string;
  /** Structured remediation hints */
  remediation?: {
    type: string;
    steps: string[];
    references?: Array<{ label: string; url: string }>;
  };
}

/**
 * Result from a single integrity check
 */
export interface IntegrityCheckResult {
  /** Whether the check passed */
  passed: boolean;
  /** Check ID */
  checkId: string;
  /** Human-readable check name */
  checkName: string;
  /** Findings produced by this check */
  findings: IntegrityFinding[];
  /** Count by severity */
  severityCounts: {
    BLOCKER: number;
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
 * Scan run options
 */
export interface IntegrityScanOptions {
  /** Specific state to scan (null for all states) */
  stateCode?: string | null;
  /** Specific checks to run (null for all) */
  checkIds?: string[] | null;
  /** Estate profiles to test with (default fixtures) */
  profiles?: EstateProfile[];
  /** Skip caching */
  skipCache?: boolean;
  /** Maximum duration per check in ms */
  timeoutMs?: number;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Complete scan run results
 */
export interface IntegrityScanReport {
  /** Scan run ID */
  scanRunId?: string;
  /** Scan type */
  scanType: 'FULL' | 'STATE' | 'CUSTOM';
  /** State code (if single-state scan) */
  stateCode?: string;
  /** Overall status */
  overallStatus: 'PASSED' | 'FAILED' | 'IN_PROGRESS';
  /** Total checks run */
  totalChecks: number;
  /** Passed checks */
  passedChecks: number;
  /** Failed checks */
  failedChecks: number;
  /** Results from each check */
  checkResults: IntegrityCheckResult[];
  /** Total findings by severity */
  totalFindings: {
    BLOCKER: number;
    CRITICAL: number;
    WARNING: number;
    INFO: number;
  };
  /** Scan metadata */
  metadata: {
    startedAt: string;
    completedAt?: string;
    totalExecutionTimeMs: number;
    version: string;
    scanOptions?: IntegrityScanOptions;
  };
}

/**
 * Integrity check function signature
 */
export type IntegrityCheck = (
  stateCode: string,
  estateProfile: EstateProfile,
  tasks: DiagnosticTask[]
) => IntegrityCheckResult | Promise<IntegrityCheckResult>;

/**
 * Scan run record (for database storage)
 */
export interface IntegrityScanRunRecord {
  id: string;
  stateCode?: string;
  scanType: 'FULL' | 'STATE' | 'CUSTOM';
  overallStatus: 'PASSED' | 'FAILED' | 'IN_PROGRESS';
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  blockerCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  triggeredBy: string;
  triggeredByUser?: string;
  scanOptions?: Record<string, unknown>;
  commitSha?: string;
  branchName?: string;
  durationMs: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Finding record (for database storage)
 */
export interface IntegrityFindingRecord {
  id: string;
  scanRunId: string;
  checkId: string;
  checkName: string;
  stateCode?: string;
  severity: FindingSeverity;
  code: string;
  message: string;
  taskId?: string;
  context?: Record<string, unknown>;
  suggestion?: string;
  remediation?: Record<string, unknown>;
  createdAt: string;
}

/**
 * State status summary
 */
export interface StateStatusSummary {
  stateCode: string;
  stateName: string;
  latestStatus: 'PASSED' | 'FAILED' | 'NEVER_RUN';
  lastScanAt?: string;
  blockerCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

/**
 * Scan history entry
 */
export interface ScanHistoryEntry {
  id: string;
  stateCode?: string;
  scanType: string;
  overallStatus: string;
  totalChecks: number;
  passedChecks: number;
  blockerCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  triggeredBy: string;
  triggeredByUser?: string;
  durationMs: number;
  createdAt: string;
  completedAt?: string;
}
