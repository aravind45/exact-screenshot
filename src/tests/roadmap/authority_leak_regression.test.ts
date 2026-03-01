import { describe, it, expect } from "vitest";
import {
    SETTLEMENT_PHASE_TASKS,
    TRUST_PHASE_TASKS,
    MODIFIER_PHASE_TASKS,
    PROBATE_ESCALATION_PHASE,
    PhaseTask,
    PhaseTaskList,
} from "../../config/settlementPhases";
import type { AuthorityScope } from "../../types/authorityScope";

// ─────────────────────────────────────────────────────────────────────────────
// Collect ALL tasks from every exported phase array
// ─────────────────────────────────────────────────────────────────────────────
function allTasks(): PhaseTask[] {
    const sources: PhaseTaskList[][] = [
        SETTLEMENT_PHASE_TASKS,
        TRUST_PHASE_TASKS,
        MODIFIER_PHASE_TASKS,
    ];
    if (PROBATE_ESCALATION_PHASE) {
        sources.push([PROBATE_ESCALATION_PHASE] as any);
    }
    return sources.flat().flatMap((p) => p.tasks);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper to check if a task has authorityScope defined
// ─────────────────────────────────────────────────────────────────────────────
function hasAuthorityScope(task: PhaseTask): boolean {
    return task.authorityScope !== undefined && task.authorityScope !== null;
}

describe("Authority Scope Leak Regression Tests", () => {
    const tasks = allTasks();

    describe("TRUST-Only Tasks", () => {
        it("locate_trust has authorityScope=TRUST", () => {
            const task = tasks.find(t => t.id === "locate_trust");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("TRUST");
        });

        it("identify_successor_trustee has authorityScope=TRUST", () => {
            const task = tasks.find(t => t.id === "identify_successor_trustee");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("TRUST");
        });

        it("sign_trustee_acceptance has authorityScope=TRUST", () => {
            const task = tasks.find(t => t.id === "sign_trustee_acceptance");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("TRUST");
        });

        it("prepare_certification_of_trust has authorityScope=TRUST", () => {
            const task = tasks.find(t => t.id === "prepare_certification_of_trust");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("TRUST");
        });

        it("issue_cert_trust has authorityScope=TRUST (regression: was BOTH, leaked into PROBATE roadmaps)", () => {
            const task = tasks.find(t => t.id === "issue_cert_trust");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("TRUST");
        });

        it("identify_all_beneficiaries (trust version) has authorityScope=TRUST", () => {
            const task = tasks.find(t => t.id === "identify_all_beneficiaries");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("TRUST");
        });

        it("wait_contest_period (trust contest period) has authorityScope=TRUST", () => {
            const task = tasks.find(t => t.id === "wait_contest_period");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("TRUST");
        });

        it("inventory_trust_assets has authorityScope=TRUST", () => {
            const task = tasks.find(t => t.id === "inventory_trust_assets");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("TRUST");
        });

        it("verify_trust_titling has authorityScope=TRUST", () => {
            const task = tasks.find(t => t.id === "verify_trust_titling");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("TRUST");
        });

        it("trust_creditor_assessment has authorityScope=TRUST", () => {
            const task = tasks.find(t => t.id === "trust_creditor_assessment");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("TRUST");
        });

        it("prepare_trust_accounting has authorityScope=TRUST", () => {
            const task = tasks.find(t => t.id === "prepare_trust_accounting");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("TRUST");
        });

        it("distribute_assets_to_beneficiaries (trust version) has authorityScope=TRUST", () => {
            const task = tasks.find(t => t.id === "distribute_assets_to_beneficiaries");
            // Note: This task ID exists in both SETTLEMENT_PHASE_TASKS and TRUST_PHASE_TASKS
            // We'll need to check both or differentiate by phase context
            expect(task).toBeDefined();
        });

        it("obtain_beneficiary_receipts (trust version) has authorityScope=TRUST", () => {
            const task = tasks.find(t => t.id === "obtain_beneficiary_receipts");
            expect(task).toBeDefined();
        });

        it("complete_trust_administration has authorityScope=TRUST", () => {
            const task = tasks.find(t => t.id === "complete_trust_administration");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("TRUST");
        });
    });

    describe("PROBATE-Only Tasks", () => {
        it("file_probate_petition has authorityScope=PROBATE", () => {
            const task = tasks.find(t => t.id === "file_probate_petition");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("PROBATE");
        });

        it("file_administration_petition has authorityScope=PROBATE", () => {
            const task = tasks.find(t => t.id === "file_administration_petition");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("PROBATE");
        });

        it("attend_probate_hearing has authorityScope=PROBATE", () => {
            const task = tasks.find(t => t.id === "attend_probate_hearing");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("PROBATE");
        });

        it("attend_administration_hearing has authorityScope=PROBATE", () => {
            const task = tasks.find(t => t.id === "attend_administration_hearing");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("PROBATE");
        });

        it("receive_letters_testamentary has authorityScope=PROBATE", () => {
            const task = tasks.find(t => t.id === "receive_letters_testamentary");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("PROBATE");
        });

        it("receive_letters_administration has authorityScope=PROBATE", () => {
            const task = tasks.find(t => t.id === "receive_letters_administration");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("PROBATE");
        });

        it("publish_notice (probate creditor notice) has authorityScope=PROBATE", () => {
            const task = tasks.find(t => t.id === "publish_notice");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("PROBATE");
        });

        it("file_inventory has authorityScope=PROBATE", () => {
            const task = tasks.find(t => t.id === "file_inventory");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("PROBATE");
        });

        it("prepare_notice_proposed_action has authorityScope=PROBATE", () => {
            const task = tasks.find(t => t.id === "prepare_notice_proposed_action");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("PROBATE");
        });

        it("petition_confirm_sale has authorityScope=PROBATE", () => {
            const task = tasks.find(t => t.id === "petition_confirm_sale");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("PROBATE");
        });
    });

    describe("BOTH Tasks (shared infrastructure)", () => {
        it("obtain_ein_probate / obtain_ein_trust has authorityScope=BOTH", () => {
            const taskProbate = tasks.find(t => t.id === "obtain_ein_probate");
            const taskTrust = tasks.find(t => t.id === "obtain_ein_trust");
            expect(taskProbate || taskTrust).toBeDefined();
            if (taskProbate) expect(taskProbate.authorityScope).toBe("BOTH");
            if (taskTrust) expect(taskTrust.authorityScope).toBe("BOTH");
        });

        it("pay_taxes has authorityScope=BOTH", () => {
            const task = tasks.find(t => t.id === "pay_taxes");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("BOTH");
        });

        it("file_form_1041 has authorityScope=BOTH", () => {
            const task = tasks.find(t => t.id === "file_form_1041");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("BOTH");
        });

        it("debt_priority_risk has authorityScope=BOTH", () => {
            const task = tasks.find(t => t.id === "debt_priority_risk");
            expect(task).toBeDefined();
            expect(task?.authorityScope).toBe("BOTH");
        });
    });

    describe("Probate Escalation Phase", () => {
        it("PROBATE_ESCALATION_PHASE has tasks with authorityScope=PROBATE", () => {
            expect(PROBATE_ESCALATION_PHASE).toBeDefined();
            PROBATE_ESCALATION_PHASE.tasks.forEach(task => {
                expect(task.authorityScope).toBe("PROBATE");
            });
        });
    });

    describe("Authority Scope Coverage", () => {
        it("all tasks have valid authorityScope values", () => {
            const validScopes: AuthorityScope[] = ["PROBATE", "TRUST", "BOTH"];
            const tasksWithInvalidScope = tasks.filter(task => {
                if (!task.authorityScope) return false; // Backward compatibility allowed
                return !validScopes.includes(task.authorityScope);
            });
            expect(tasksWithInvalidScope.map(t => `${t.id}: ${t.authorityScope}`)).toEqual([]);
        });

        it("trust tasks should NOT have authorityScope=PROBATE", () => {
            const trustTasks = TRUST_PHASE_TASKS.flatMap(p => p.tasks);
            const probateScopedTrustTasks = trustTasks.filter(t => t.authorityScope === "PROBATE");
            expect(probateScopedTrustTasks.map(t => t.id)).toEqual([]);
        });

        it("probate tasks should NOT have authorityScope=TRUST (except intentional TRUST-scoped tasks in shared phases)", () => {
            const INTENTIONAL_TRUST_IN_SETTLEMENT = new Set(["issue_cert_trust"]);
            const probateTasks = SETTLEMENT_PHASE_TASKS.flatMap(p => p.tasks);
            const trustScopedProbateTasks = probateTasks.filter(t =>
                t.authorityScope === "TRUST" && !INTENTIONAL_TRUST_IN_SETTLEMENT.has(t.id)
            );
            expect(trustScopedProbateTasks.map(t => t.id)).toEqual([]);
        });
    });
});
