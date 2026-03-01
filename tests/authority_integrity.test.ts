/**
 * Authority Integrity CI Gate Tests
 *
 * These tests enforce ZERO authority leakage at CI time:
 * 1. All config tasks have valid authorityScope
 * 2. PROBATE filtering produces zero TRUST-only tasks
 * 3. TRUST filtering produces zero PROBATE-only tasks
 * 4. issue_cert_trust is tagged TRUST (not BOTH)
 * 5. No placeholder patterns in task content
 */

import { describe, it, expect } from "vitest";
import { SETTLEMENT_PHASE_TASKS } from "../src/config/settlementPhases";
import { filterTasksByAuthorityScope } from "../src/shared/filterByJurisdiction";
import type { EstateAuthorityType } from "../src/types/authorityScope";

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

function getAllTasks() {
  return SETTLEMENT_PHASE_TASKS.flatMap((p) => p.tasks);
}

describe("Authority Scope Integrity (CI Gate)", () => {
  describe("Config: all tasks have valid authorityScope", () => {
    it("should have zero tasks with missing authorityScope", () => {
      const tasks = getAllTasks();
      const missing = tasks.filter(
        (t) => !(t as { authorityScope?: string }).authorityScope
      );

      if (missing.length > 0) {
        console.error(
          "Tasks with missing authorityScope:",
          missing.map((t) => t.id)
        );
      }

      expect(missing).toHaveLength(0);
    });

    it("should have zero tasks with invalid authorityScope values", () => {
      const tasks = getAllTasks();
      const invalid = tasks.filter((t) => {
        const scope = (t as { authorityScope?: string }).authorityScope;
        return scope && !VALID_SCOPES.has(scope);
      });

      if (invalid.length > 0) {
        console.error(
          "Tasks with invalid authorityScope:",
          invalid.map((t) => ({
            id: t.id,
            scope: (t as { authorityScope?: string }).authorityScope,
          }))
        );
      }

      expect(invalid).toHaveLength(0);
    });
  });

  describe("Known mis-tag fixes", () => {
    it("issue_cert_trust must be TRUST (not BOTH)", () => {
      const task = getAllTasks().find((t) => t.id === "issue_cert_trust");
      expect(task).toBeDefined();
      expect((task as { authorityScope?: string }).authorityScope).toBe("TRUST");
    });

    it("sign_trustee_acceptance must be TRUST", () => {
      const task = getAllTasks().find((t) => t.id === "sign_trustee_acceptance");
      if (task) {
        expect((task as { authorityScope?: string }).authorityScope).toBe("TRUST");
      }
    });

    it("close_trust_accounts must be TRUST", () => {
      const task = getAllTasks().find((t) => t.id === "close_trust_accounts");
      if (task) {
        expect((task as { authorityScope?: string }).authorityScope).toBe("TRUST");
      }
    });

    it("file_probate_petition must be PROBATE", () => {
      const task = getAllTasks().find((t) => t.id === "file_probate_petition");
      if (task) {
        expect((task as { authorityScope?: string }).authorityScope).toBe("PROBATE");
      }
    });
  });

  describe("Fail-closed filter: PROBATE estate leakage", () => {
    it("should drop tasks with missing authorityScope for PROBATE estates", () => {
      const taskWithNoScope = {
        id: "missing_scope_task",
        scope: "CORE",
        authorityScope: undefined as unknown as "PROBATE",
      };
      const result = filterTasksByAuthorityScope([taskWithNoScope], "PROBATE");
      expect(result.kept).toHaveLength(0);
      expect(result.dropped).toHaveLength(1);
      expect(result.dropped[0].reason).toContain("FAIL-CLOSED");
    });

    it("should not show TRUST-only tasks for PROBATE estate", () => {
      const tasks = getAllTasks().map((t) => ({
        ...t,
        authorityScope: (t as { authorityScope?: string }).authorityScope as
          | "PROBATE"
          | "TRUST"
          | "BOTH",
      }));

      const probateType: EstateAuthorityType = "PROBATE";
      const { kept } = filterTasksByAuthorityScope(tasks, probateType);

      const leaked = kept.filter((t) => TRUST_ONLY_TASK_CODES.has(t.id));

      if (leaked.length > 0) {
        console.error(
          "TRUST tasks leaked into PROBATE roadmap:",
          leaked.map((t) => t.id)
        );
      }

      expect(leaked).toHaveLength(0);
    });
  });

  describe("Fail-closed filter: TRUST estate leakage", () => {
    it("should not show PROBATE-only tasks for TRUST estate", () => {
      const tasks = getAllTasks().map((t) => ({
        ...t,
        authorityScope: (t as { authorityScope?: string }).authorityScope as
          | "PROBATE"
          | "TRUST"
          | "BOTH",
      }));

      const trustType: EstateAuthorityType = "TRUST";
      const { kept } = filterTasksByAuthorityScope(tasks, trustType);

      const leaked = kept.filter((t) => PROBATE_ONLY_TASK_CODES.has(t.id));

      if (leaked.length > 0) {
        console.error(
          "PROBATE tasks leaked into TRUST roadmap:",
          leaked.map((t) => t.id)
        );
      }

      expect(leaked).toHaveLength(0);
    });
  });

  describe("BOTH estate: shows all valid tasks", () => {
    it("should show all tasks with valid authorityScope for BOTH estate", () => {
      const tasks = getAllTasks()
        .filter((t) => {
          const scope = (t as { authorityScope?: string }).authorityScope;
          return scope && VALID_SCOPES.has(scope);
        })
        .map((t) => ({
          ...t,
          authorityScope: (t as { authorityScope?: string }).authorityScope as
            | "PROBATE"
            | "TRUST"
            | "BOTH",
        }));

      const { dropped } = filterTasksByAuthorityScope(tasks, "BOTH");
      expect(dropped).toHaveLength(0);
    });
  });

  describe("Placeholder guard", () => {
    it("should have no {{ placeholder patterns in task titles", () => {
      const tasks = getAllTasks();
      const withPlaceholders = tasks.filter((t) => t.title.includes("{{"));
      expect(withPlaceholders).toHaveLength(0);
    });

    it("should have no {{ placeholder patterns in task descriptions", () => {
      const tasks = getAllTasks();
      const withPlaceholders = tasks.filter((t) =>
        t.description.includes("{{")
      );
      expect(withPlaceholders).toHaveLength(0);
    });
  });
});
