/**
 * Config Lint: Authority Scope Audit
 *
 * Parses SETTLEMENT_PHASE_TASKS and asserts that every task has a valid
 * authorityScope (PROBATE, TRUST, or BOTH). Exits with code 1 if any
 * task is missing or has an invalid authorityScope — blocking CI merges.
 */

import { SETTLEMENT_PHASE_TASKS } from "../../src/config/settlementPhases.js";

const VALID_SCOPES = new Set(["PROBATE", "TRUST", "BOTH"]);

interface Violation {
  taskId: string;
  phase: string;
  authorityScope: string | undefined;
  reason: string;
}

function auditAuthorityScopes(): void {
  const violations: Violation[] = [];

  for (const phaseList of SETTLEMENT_PHASE_TASKS) {
    for (const task of phaseList.tasks) {
      const scope = (task as { authorityScope?: string }).authorityScope;

      if (!scope) {
        violations.push({
          taskId: task.id,
          phase: phaseList.phase,
          authorityScope: undefined,
          reason: "authorityScope is missing/undefined",
        });
        continue;
      }

      if (!VALID_SCOPES.has(scope)) {
        violations.push({
          taskId: task.id,
          phase: phaseList.phase,
          authorityScope: scope,
          reason: `Invalid value "${scope}" — must be PROBATE, TRUST, or BOTH`,
        });
      }
    }
  }

  const totalTasks = SETTLEMENT_PHASE_TASKS.reduce(
    (sum, p) => sum + p.tasks.length,
    0
  );

  console.log(`\n=== Authority Scope Audit ===`);
  console.log(`Total tasks audited: ${totalTasks}`);
  console.log(`Violations found: ${violations.length}`);

  if (violations.length > 0) {
    console.error("\n❌ AUTHORITY SCOPE VIOLATIONS DETECTED:\n");
    for (const v of violations) {
      console.error(
        `  [${v.phase}] task "${v.taskId}": ${v.reason}`
      );
    }
    console.error(
      "\nFix all violations before merging. Every task MUST have authorityScope: PROBATE | TRUST | BOTH"
    );
    process.exit(1);
  }

  console.log("\n✅ All tasks have valid authorityScope values.\n");
}

auditAuthorityScopes();
