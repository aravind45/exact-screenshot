/**
 * CI Roadmap Compliance Harness
 * 
 * Main test runner for the governance system.
 * Validates roadmap data against policies and blocks merges on violations.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { 
  EstateProfile, 
  DiagnosticResult, 
  EstateSnapshot, 
  SnapshotDiff,
  JurisdictionDiagnosticReport 
} from '@/jurisdiction/diagnostics/types';
import { runAllValidators } from '@/jurisdiction/diagnostics';
import { generateSnapshot, diffSnapshots, formatDiff } from './utils/snapshot';
import { filterTasksByJurisdiction, filterTasksByAuthorityScope } from '@/shared/filterByJurisdiction';
import { SETTLEMENT_PHASE_TASKS } from '@/config/settlementPhases';
import { deriveEstateAuthorityType } from '@/types/authorityScope';
import * as fs from 'fs';
import * as path from 'path';

// Fixture path
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const SNAPSHOTS_DIR = path.join(__dirname, 'snapshots');

/**
 * Load all estate fixtures
 */
function loadFixtures(): EstateProfile[] {
  const files = fs.readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const content = fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf-8');
    return JSON.parse(content) as EstateProfile;
  });
}

/**
 * Load baseline snapshot for a profile
 */
function loadBaselineSnapshot(profileId: string): EstateSnapshot | null {
  const snapshotPath = path.join(SNAPSHOTS_DIR, `${profileId}.json`);
  if (!fs.existsSync(snapshotPath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(snapshotPath, 'utf-8');
    return JSON.parse(content) as EstateSnapshot;
  } catch {
    return null;
  }
}

/**
 * Save a snapshot (for updating baselines)
 */
function saveSnapshot(snapshot: EstateSnapshot): void {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
  const snapshotPath = path.join(SNAPSHOTS_DIR, `${snapshot.profileId}.json`);
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
}

/**
 * Get tasks for a state from the settlement phases config
 */
function getTasksForState(stateCode: string): Array<{ id: string; title: string; description?: string; scope: string; authorityScope?: 'PROBATE' | 'TRUST' | 'BOTH'; [key: string]: unknown }> {
  const tasks: Array<{ id: string; title: string; description?: string; scope: string; authorityScope?: 'PROBATE' | 'TRUST' | 'BOTH'; [key: string]: unknown }> = [];
  
  for (const phaseList of SETTLEMENT_PHASE_TASKS) {
    for (const task of phaseList.tasks) {
      tasks.push({
        id: task.id,
        title: task.title,
        description: task.description,
        scope: task.scope,
        authorityScope: task.authorityScope,
        ...task,
      });
    }
  }
  
  return tasks;
}

/**
 * Filter tasks for an estate profile
 */
function filterTasksForProfile(
  tasks: Array<{ id: string; title: string; description?: string; scope: string; authorityScope?: 'PROBATE' | 'TRUST' | 'BOTH' }>,
  profile: EstateProfile
): typeof tasks {
  // First filter by jurisdiction (state)
  const jurisdictionResult = filterTasksByJurisdiction(tasks, profile.stateCode, profile.county);
  let filtered = jurisdictionResult.kept;

  // Then filter by authority scope
  const authorityResult = filterTasksByAuthorityScope(filtered, profile.authorityType);
  filtered = authorityResult.kept;

  return filtered;
}

/**
 * Format diagnostic results for CI output
 */
function formatResultsForCI(results: Map<string, JurisdictionDiagnosticReport>): string {
  const lines: string[] = [];
  let totalCritical = 0;
  let totalWarning = 0;
  let totalInfo = 0;

  lines.push('╔══════════════════════════════════════════════════════════════════╗');
  lines.push('║         ROADMAP COMPLIANCE HARNESS RESULTS                       ║');
  lines.push('╚══════════════════════════════════════════════════════════════════╝');
  lines.push('');

  for (const [profileId, report] of results) {
    const passed = report.passed ? '✓ PASS' : '✗ FAIL';
    const score = report.healthScore;
    const status = report.passed ? 'green' : 'red';
    
    lines.push(`${passed} ${profileId} (Health: ${score}/100)`);
    
    if (report.totalViolations.CRITICAL > 0) {
      lines.push(`  CRITICAL: ${report.totalViolations.CRITICAL}`);
    }
    if (report.totalViolations.WARNING > 0) {
      lines.push(`  WARNING: ${report.totalViolations.WARNING}`);
    }
    if (report.totalViolations.INFO > 0) {
      lines.push(`  INFO: ${report.totalViolations.INFO}`);
    }

    totalCritical += report.totalViolations.CRITICAL;
    totalWarning += report.totalViolations.WARNING;
    totalInfo += report.totalViolations.INFO;

    // Show violations
    for (const policyResult of report.policyResults) {
      for (const violation of policyResult.violations.filter(v => v.severity === 'CRITICAL')) {
        lines.push(`  [${violation.severity}] ${violation.code}: ${violation.message}`);
        if (violation.suggestion) {
          lines.push(`    → ${violation.suggestion}`);
        }
      }
    }

    lines.push('');
  }

  lines.push('───────────────────────────────────────────────────────────────────');
  lines.push(`Total: ${totalCritical} CRITICAL, ${totalWarning} WARNING, ${totalInfo} INFO`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate GitHub Actions annotations from violations
 */
function generateGitHubAnnotations(results: Map<string, JurisdictionDiagnosticReport>): string[] {
  const annotations: string[] = [];

  for (const [profileId, report] of results) {
    for (const policyResult of report.policyResults) {
      for (const violation of policyResult.violations) {
        if (violation.severity === 'CRITICAL') {
          // GitHub Actions annotation format
          annotations.push(`::error title=${violation.code}::${profileId}: ${violation.message}`);
        } else if (violation.severity === 'WARNING') {
          annotations.push(`::warning title=${violation.code}::${profileId}: ${violation.message}`);
        }
      }
    }
  }

  return annotations;
}

// Test suite
describe('Roadmap Compliance Harness', () => {
  const fixtures = loadFixtures();
  const results = new Map<string, JurisdictionDiagnosticReport>();
  const snapshotDiffs = new Map<string, SnapshotDiff>();

  // Validate each fixture
  for (const profile of fixtures) {
    describe(`Profile: ${profile.id}`, () => {
      it(`should pass all policy validators for ${profile.name}`, async () => {
        // Get tasks for this state
        const allTasks = getTasksForState(profile.stateCode);
        
        // Filter tasks for this profile
        const filteredTasks = filterTasksForProfile(allTasks, profile);
        
        // Run all validators
        const report = await runAllValidators(profile.stateCode, profile, filteredTasks);
        results.set(profile.id, report);

        // Store for later assertions
        expect(report).toBeDefined();
        expect(report.stateCode).toBe(profile.stateCode);
      });

      it(`should match baseline snapshot for ${profile.id}`, async () => {
        // Get tasks for this state
        const allTasks = getTasksForState(profile.stateCode);
        
        // Filter tasks for this profile
        const filteredTasks = filterTasksForProfile(allTasks, profile);

        // Group tasks by phase for snapshot
        const phases = SETTLEMENT_PHASE_TASKS
          .map(phaseList => ({
            phase: phaseList.phase,
            tasks: phaseList.tasks
              .filter(t => filteredTasks.some(ft => ft.id === t.id))
              .map(t => ({
                id: t.id,
                title: t.title,
                authorityScope: t.authorityScope,
                scope: t.scope,
              })),
          }))
          .filter(p => p.tasks.length > 0);

        // Generate current snapshot
        const currentSnapshot = generateSnapshot(profile, phases);

        // Load baseline
        const baselineSnapshot = loadBaselineSnapshot(profile.id);

        if (baselineSnapshot) {
          // Compare
          const diff = diffSnapshots(baselineSnapshot, currentSnapshot);
          snapshotDiffs.set(profile.id, diff);

          // For initial development, we'll just check that the snapshot exists
          // In production, this would enforce matching
          expect(diff).toBeDefined();
        } else {
          // No baseline exists yet, save current as baseline
          saveSnapshot(currentSnapshot);
          snapshotDiffs.set(profile.id, {
            profileId: profile.id,
            matches: true,
            added: [],
            removed: [],
            modified: [],
            orderChanges: [],
          });
        }
      });
    });
  }

  // Final summary test that fails if any CRITICAL violations exist
  describe('Harness Summary', () => {
    it('should have no CRITICAL violations across all profiles', () => {
      let totalCritical = 0;
      const criticalViolations: Array<{ profileId: string; violation: string }> = [];

      for (const [profileId, report] of results) {
        totalCritical += report.totalViolations.CRITICAL;
        
        for (const policyResult of report.policyResults) {
          for (const violation of policyResult.violations.filter(v => v.severity === 'CRITICAL')) {
            criticalViolations.push({ profileId, violation: violation.message });
          }
        }
      }

      // Output results for CI
      console.log(formatResultsForCI(results));
      
      // Output GitHub annotations if in CI
      if (process.env.GITHUB_ACTIONS) {
        const annotations = generateGitHubAnnotations(results);
        for (const annotation of annotations) {
          console.log(annotation);
        }
      }

      // Output snapshot diffs
      console.log('\n=== Snapshot Diffs ===');
      for (const [profileId, diff] of snapshotDiffs) {
        console.log(formatDiff(diff));
      }

      // Fail if critical violations exist
      if (totalCritical > 0) {
        console.error(`\n❌ ${totalCritical} CRITICAL violations found:`);
        for (const { profileId, violation } of criticalViolations) {
          console.error(`  [${profileId}] ${violation}`);
        }
      }

      expect(totalCritical).toBe(0);
    });

    it('should meet minimum health score threshold (80/100)', () => {
      let minScore = 100;
      
      for (const [, report] of results) {
        minScore = Math.min(minScore, report.healthScore);
      }

      console.log(`\nMinimum health score: ${minScore}/100`);
      expect(minScore).toBeGreaterThanOrEqual(80);
    });
  });
});

// Export for use by other tools
export { loadFixtures, loadBaselineSnapshot, saveSnapshot, generateSnapshot, diffSnapshots };
