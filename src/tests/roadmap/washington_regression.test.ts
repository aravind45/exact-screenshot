import { describe, it, expect } from "vitest";
import {
    SETTLEMENT_PHASE_TASKS,
    TRUST_PHASE_TASKS,
    PROBATE_ESCALATION_PHASE,
    PhaseTaskList,
    PhaseTask,
} from "../../config/settlementPhases";
import type { AuthorityScope } from "../../types/authorityScope";
import { filterTasksByAuthorityScope } from "../../shared/filterByJurisdiction";

// ─────────────────────────────────────────────────────────────────────────────
// Helper to get all tasks for testing
// ─────────────────────────────────────────────────────────────────────────────
function allTasks(): PhaseTask[] {
    const sources: PhaseTaskList[][] = [
        SETTLEMENT_PHASE_TASKS,
        TRUST_PHASE_TASKS,
        [PROBATE_ESCALATION_PHASE] as any,
    ];
    return sources.flat().flatMap((p) => p.tasks);
}

describe("Washington State Authority Scope Regression Tests", () => {
    const tasks = allTasks();

    describe("Washington TRUST-Only Estates", () => {
        it("should NOT show probate petitions", () => {
            const estateAuthorityType: "TRUST" = "TRUST";
            const { kept, dropped } = filterTasksByAuthorityScope(tasks, estateAuthorityType);

            // Check that probate petition tasks are dropped
            const probatePetitionTaskIds = [
                "file_probate_petition",
                "file_administration_petition",
                "attend_probate_hearing",
                "attend_administration_hearing",
            ];

            probatePetitionTaskIds.forEach(taskId => {
                const isKept = kept.some(t => t.id === taskId);
                const isDropped = dropped.some(d => d.id === taskId);
                expect(isDropped).toBe(true);
                expect(isKept).toBe(false);
            });
        });

        it("should NOT show probate Letters tasks", () => {
            const estateAuthorityType: "TRUST" = "TRUST";
            const { kept, dropped } = filterTasksByAuthorityScope(tasks, estateAuthorityType);

            const lettersTaskIds = [
                "receive_letters_testamentary",
                "receive_letters_administration",
            ];

            lettersTaskIds.forEach(taskId => {
                const isKept = kept.some(t => t.id === taskId);
                const isDropped = dropped.some(d => d.id === taskId);
                expect(isDropped).toBe(true);
                expect(isKept).toBe(false);
            });
        });

        it("should NOT show probate creditor notice tasks", () => {
            const estateAuthorityType: "TRUST" = "TRUST";
            const { kept, dropped } = filterTasksByAuthorityScope(tasks, estateAuthorityType);

            const creditorNoticeTaskIds = [
                "publish_notice",
            ];

            creditorNoticeTaskIds.forEach(taskId => {
                const isKept = kept.some(t => t.id === taskId);
                const isDropped = dropped.some(d => d.id === taskId);
                expect(isDropped).toBe(true);
                expect(isKept).toBe(false);
            });
        });

        it("should NOT show probate inventory tasks", () => {
            const estateAuthorityType: "TRUST" = "TRUST";
            const { kept, dropped } = filterTasksByAuthorityScope(tasks, estateAuthorityType);

            const inventoryTaskIds = [
                "file_inventory",
            ];

            inventoryTaskIds.forEach(taskId => {
                const isKept = kept.some(t => t.id === taskId);
                const isDropped = dropped.some(d => d.id === taskId);
                expect(isDropped).toBe(true);
                expect(isKept).toBe(false);
            });
        });
    });

    describe("Washington PROBATE-Only Estates", () => {
        it("should NOT show trust certification tasks", () => {
            const estateAuthorityType: "PROBATE" = "PROBATE";
            const { kept, dropped } = filterTasksByAuthorityScope(tasks, estateAuthorityType);

            const trustCertTaskIds = [
                "prepare_certification_of_trust",
                "issue_cert_trust",
            ];

            trustCertTaskIds.forEach(taskId => {
                const isKept = kept.some(t => t.id === taskId);
                const isDropped = dropped.some(d => d.id === taskId);
                expect(isDropped).toBe(true);
                expect(isKept).toBe(false);
            });
        });

        it("should NOT show trust acceptance tasks", () => {
            const estateAuthorityType: "PROBATE" = "PROBATE";
            const { kept, dropped } = filterTasksByAuthorityScope(tasks, estateAuthorityType);

            const trustAcceptTaskIds = [
                "sign_trustee_acceptance",
                "identify_successor_trustee",
            ];

            trustAcceptTaskIds.forEach(taskId => {
                const isKept = kept.some(t => t.id === taskId);
                const isDropped = dropped.some(d => d.id === taskId);
                expect(isDropped).toBe(true);
                expect(isKept).toBe(false);
            });
        });

        it("should NOT show trust accounting tasks", () => {
            const estateAuthorityType: "PROBATE" = "PROBATE";
            const { kept, dropped } = filterTasksByAuthorityScope(tasks, estateAuthorityType);

            const trustAccountingTaskIds = [
                "prepare_trust_accounting",
            ];

            trustAccountingTaskIds.forEach(taskId => {
                const isKept = kept.some(t => t.id === taskId);
                const isDropped = dropped.some(d => d.id === taskId);
                expect(isDropped).toBe(true);
                expect(isKept).toBe(false);
            });
        });
    });

    describe("Washington BOTH Estates", () => {
        it("should show ALL scoped tasks (no authority mismatch drops)", () => {
            const estateAuthorityType: "BOTH" = "BOTH";
            const { kept, dropped } = filterTasksByAuthorityScope(tasks, estateAuthorityType);

            // For BOTH estates, no tasks should be dropped due to authorityScope mismatch.
            // Tasks dropped for null/undefined authorityScope are correctly excluded (fail-closed).
            const mismatchDropped = dropped.filter(d =>
                d.reason.includes("does not match estateAuthorityType")
            );
            expect(mismatchDropped).toHaveLength(0);
        });
    });
});
