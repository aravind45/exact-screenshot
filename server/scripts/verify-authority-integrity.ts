/**
 * Authority Integrity Verification Script
 *
 * CI gate that asserts:
 *   1. All tasks in SETTLEMENT_PHASE_TASKS have a valid authorityScope
 *   2. PROBATE fixtures contain zero TRUST-only task codes
 *   3. TRUST fixtures contain zero PROBATE-only task codes
 *   4. No "{{" placeholder patterns in task content
 *
 * Exit code 0 = all checks pass
 * Exit code 1 = integrity violations detected (blocks merge)
 */

import { SETTLEMENT_PHASE_TASKS } from "../../src/config/settlementPhases.js";
import { filterTasksByAuthorityScope } from "../../src/shared/filterByJurisdiction.js";
import type { EstateAuthorityType } from "../../src/types/authorityScope.js";

const VALID_SCOPES = new Set(["PROBATE", "TRUST", "BOTH"]);

const TRUST_ONLY_TASK_CODES = new Set([
  "locate_trust",
  "identify_successor_trustee",
  "sign_trustee_acceptance",
  "prepare_certification_of_trust",
  "issue_cert_trust",
  "notify_trust_beneficiaries",
  "distribute_trust_assets",
  "file_trust_tax_return",
  "close_trust_accounts",
  "complete_trust_administration",
  "trustee_accounting",
  "trustee_acceptance",
]);

const PROBATE_ONLY_TASK_CODES = new Set([
  "file_probate_petition",
  "file_administration_petition",
  "attend_probate_hearing",
  "attend_administration_hearing",
  "receive_letters_testamentary",
  "receive_letters_administration",
  "handle_bond_waivers",
  "obtain_bond_waiver_order",
  "file_inventory_appraisal",
  "file_final_accounting",
  "file_spousal_petition",
  "obtain_spousal_order",
  "file_succession_petition",
  "obtain_succession_order",
  "obtain_citation",
  "serve_citation",
  "publish_notice_to_creditors",
]);

interface IntegrityViolation {
  check: string;
  taskId: string;
  detail: string;
}

let totalViolations = 0;
const allViolations: IntegrityViolation[] = [];

function report(violation: IntegrityViolation): void {
  allViolations.push(violation);
  totalViolations++;
}

function getAllTasks() {
  return SETTLEMENT_PHASE_TASKS.flatMap((p) => p.tasks);
}

function check1_allTasksHaveValidScope(): void {
  console.log("\n[CHECK 1] All tasks have valid authorityScope...");
  const tasks = getAllTasks();
  let passed = 0;

  for (const task of tasks) {
    const scope = (task as { authorityScope?: string }).authorityScope;
    if (!scope) {
      report({
        check: "MISSING_AUTHORITY_SCOPE",
        taskId: task.id,
        detail: "authorityScope is missing/undefined",
      });
    } else if (!VALID_SCOPES.has(scope)) {
      report({
        check: "INVALID_AUTHORITY_SCOPE",
        taskId: task.id,
        detail: `Invalid value "${scope}" — must be PROBATE, TRUST, or BOTH`,
      });
    } else {
      passed++;
    }
  }

  console.log(`  Tasks checked: ${tasks.length}, passed: ${passed}, failed: ${tasks.length - passed}`);
}

function check2_probateFixturesHaveNoTrustTasks(): void {
  console.log("\n[CHECK 2] PROBATE fixtures contain zero TRUST-only tasks...");
  const tasks = getAllTasks().map((t) => ({
    ...t,
    authorityScope: (t as { authorityScope?: string }).authorityScope as "PROBATE" | "TRUST" | "BOTH",
  }));

  const probateEstateType: EstateAuthorityType = "PROBATE";
  const { kept } = filterTasksByAuthorityScope(tasks, probateEstateType);

  for (const task of kept) {
    if (TRUST_ONLY_TASK_CODES.has(task.id)) {
      report({
        check: "TRUST_TASK_IN_PROBATE_ROADMAP",
        taskId: task.id,
        detail: `Trust-only task "${task.id}" appeared in PROBATE roadmap filter result`,
      });
    }
  }

  const leakCount = kept.filter((t) => TRUST_ONLY_TASK_CODES.has(t.id)).length;
  console.log(`  Trust-only tasks leaked into PROBATE roadmap: ${leakCount}`);
}

function check3_trustFixturesHaveNoProbateTasks(): void {
  console.log("\n[CHECK 3] TRUST fixtures contain zero PROBATE-only tasks...");
  const tasks = getAllTasks().map((t) => ({
    ...t,
    authorityScope: (t as { authorityScope?: string }).authorityScope as "PROBATE" | "TRUST" | "BOTH",
  }));

  const trustEstateType: EstateAuthorityType = "TRUST";
  const { kept } = filterTasksByAuthorityScope(tasks, trustEstateType);

  for (const task of kept) {
    if (PROBATE_ONLY_TASK_CODES.has(task.id)) {
      report({
        check: "PROBATE_TASK_IN_TRUST_ROADMAP",
        taskId: task.id,
        detail: `Probate-only task "${task.id}" appeared in TRUST roadmap filter result`,
      });
    }
  }

  const leakCount = kept.filter((t) => PROBATE_ONLY_TASK_CODES.has(t.id)).length;
  console.log(`  Probate-only tasks leaked into TRUST roadmap: ${leakCount}`);
}

function check4_noPlaceholdersInTaskContent(): void {
  console.log("\n[CHECK 4] No placeholder patterns ({{ }}) in task content...");
  const tasks = getAllTasks();
  let placeholderCount = 0;

  for (const task of tasks) {
    const fieldsToCheck = [
      { field: "title", value: task.title },
      { field: "description", value: task.description },
      ...(task.requiredDocs || []).map((d: string) => ({ field: "requiredDocs", value: d })),
    ];

    for (const { field, value } of fieldsToCheck) {
      if (value && value.includes("{{")) {
        report({
          check: "PLACEHOLDER_IN_TASK_CONTENT",
          taskId: task.id,
          detail: `Task "${task.id}" field "${field}" contains placeholder pattern: ${value.substring(0, 60)}`,
        });
        placeholderCount++;
      }
    }
  }

  console.log(`  Placeholder patterns found: ${placeholderCount}`);
}

function printSummary(): void {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  AUTHORITY INTEGRITY VERIFICATION RESULTS");
  console.log("═══════════════════════════════════════════════════════");

  const totalTasks = getAllTasks().length;
  const scopeDist = { PROBATE: 0, TRUST: 0, BOTH: 0 };
  for (const task of getAllTasks()) {
    const s = (task as { authorityScope?: string }).authorityScope;
    if (s === "PROBATE") scopeDist.PROBATE++;
    else if (s === "TRUST") scopeDist.TRUST++;
    else if (s === "BOTH") scopeDist.BOTH++;
  }

  console.log(`\nTotal tasks: ${totalTasks}`);
  console.log(`  PROBATE: ${scopeDist.PROBATE}`);
  console.log(`  TRUST:   ${scopeDist.TRUST}`);
  console.log(`  BOTH:    ${scopeDist.BOTH}`);
  console.log(`\nTotal violations: ${totalViolations}`);

  if (totalViolations > 0) {
    console.error("\n❌ VIOLATIONS:\n");
    for (const v of allViolations) {
      console.error(`  [${v.check}] ${v.taskId}: ${v.detail}`);
    }
    console.error("\n❌ Authority integrity check FAILED. Fix violations before merging.\n");
    process.exit(1);
  }

  console.log("\n✅ Authority integrity check PASSED. Zero leakage detected.\n");
}

check1_allTasksHaveValidScope();
check2_probateFixturesHaveNoTrustTasks();
check3_trustFixturesHaveNoProbateTasks();
check4_noPlaceholdersInTaskContent();
printSummary();
