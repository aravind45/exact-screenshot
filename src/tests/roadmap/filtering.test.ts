import { describe, it, expect } from "vitest";
import { filterTasksForEstate } from "../../../server/services/roadmapService";
import { SETTLEMENT_PHASE_TASKS } from "../../config/settlementPhases";

describe("Roadmap Filtering Logic", () => {
    const mockProfile = {
        id: "test-estate",
        hasMinorBeneficiaries: false,
        isSmallEstate: false,
        isPrimaryResidence: false,
        isContested: false,
        state: "CA",
        estimatedValue: 200000,
    };

    it("should hide guardian ad litem tasks when no minor beneficiaries", () => {
        const filtered = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, {
            ...mockProfile,
            hasMinorBeneficiaries: false,
        });

        const guardianTasks = filtered.flatMap(p => p.tasks).filter(t => t.id === "identify_minor_beneficiaries");
        expect(guardianTasks).toHaveLength(0);
    });

    it("should show guardian ad litem tasks when minor beneficiaries present", () => {
        const filtered = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, {
            ...mockProfile,
            hasMinorBeneficiaries: true,
        });

        const guardianTasks = filtered.flatMap(p => p.tasks).filter(t => t.id === "identify_minor_beneficiaries");
        expect(guardianTasks).toHaveLength(1);
    });

    it("should hide primary residence succession tasks when not a primary residence", () => {
        const filtered = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, {
            ...mockProfile,
            isSmallEstate: true,
            isPrimaryResidence: false,
            state: "CA",
        });

        const successionTasks = filtered.flatMap(p => p.tasks).filter(t => t.id === "file_succession_petition");
        expect(successionTasks).toHaveLength(0);
    });

    it("should show primary residence succession tasks for small CA estates with primary residence", () => {
        const filtered = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, {
            ...mockProfile,
            isSmallEstate: true,
            isPrimaryResidence: true,
            state: "CA",
        });

        const tasks = filtered.flatMap(p => p.tasks);
        expect(tasks.filter(t => t.id === "file_succession_petition")).toHaveLength(1);
        expect(tasks.filter(t => t.id === "give_succession_notice")).toHaveLength(1);
        expect(tasks.filter(t => t.id === "obtain_succession_order")).toHaveLength(1);
    });

    it("should show contest tasks only when estate is contested", () => {
        const uncontested = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, {
            ...mockProfile,
            isContested: false,
        });
        expect(uncontested.flatMap(p => p.tasks).filter(t => t.id === "respond_to_objections")).toHaveLength(0);

        const contested = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, {
            ...mockProfile,
            isContested: true,
        });
        expect(contested.flatMap(p => p.tasks).filter(t => t.id === "respond_to_objections")).toHaveLength(1);
    });

    it("should always show special notice tasks as they are common", () => {
        const filtered = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, mockProfile);
        const noticeTasks = filtered.flatMap(p => p.tasks).filter(t => t.id === "track_special_notice_requests");
        expect(noticeTasks).toHaveLength(1);
    });

    it("should always show bond waiver tasks as they offer cost savings", () => {
        const filtered = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, mockProfile);
        const tasks = filtered.flatMap(p => p.tasks);
        expect(tasks.filter(t => t.id === "request_bond_waiver")).toHaveLength(1);
        expect(tasks.filter(t => t.id === "obtain_bond_waiver_order")).toHaveLength(1);
    });

    it("should show asset sale tasks as they are optional by default", () => {
        const filtered = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, mockProfile);
        const saleTasks = filtered.flatMap(p => p.tasks).filter(t => t.id === "prepare_notice_proposed_action");
        expect(saleTasks).toHaveLength(1);
    });
});
