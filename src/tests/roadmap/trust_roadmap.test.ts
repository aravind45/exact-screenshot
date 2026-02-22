import { describe, it, expect } from "vitest";
import { generateRoadmap } from "../../config/roadmapGenerator";

describe("Trust Admin Roadmap Generation", () => {
    it("should NOT include DE-111 or DE-150 tasks for TRUST_ADMIN_REVOCABLE", () => {
        // Generate roadmap for revocable trust
        const roadmap = generateRoadmap("TRUST_ADMIN_REVOCABLE", "CA", [], ["TRUST"]);
        const allTaskIds = roadmap.flatMap(p => p.tasks.map(t => t.id));

        // Probate-specific tasks should be missing
        expect(allTaskIds).not.toContain("file_petition");
        expect(allTaskIds).not.toContain("receive_letters");
        expect(allTaskIds).not.toContain("escalation_file_petition"); // Escalation should be off by default
    });

    it("should include Certificate of Trust and Trustee Acceptance tasks", () => {
        const roadmap = generateRoadmap("TRUST_ADMIN_REVOCABLE", "CA", [], ["TRUST"]);
        const allTaskIds = roadmap.flatMap(p => p.tasks.map(t => t.id));

        expect(allTaskIds).toContain("locate_trust");
        expect(allTaskIds).toContain("sign_trustee_acceptance");
        expect(allTaskIds).toContain("prepare_certification_of_trust");
        expect(allTaskIds).toContain("file_irs_form_56");
        expect(allTaskIds).toContain("notify_state_agencies_health");
        expect(allTaskIds).toContain("obtain_beneficiary_receipts");
    });

    it("should have correct phase titles for the 6-state machine", () => {
        const roadmap = generateRoadmap("TRUST_ADMIN_REVOCABLE", "CA", [], ["TRUST"]);
        const phaseTitles = roadmap.map(p => p.title);

        expect(phaseTitles).toContain("Trustee Authority");
        expect(phaseTitles).toContain("Notice & Communications");
        expect(phaseTitles).toContain("Trust Asset Marshaling");
        expect(phaseTitles).toContain("Creditor Exposure & Expenses");
        expect(phaseTitles).toContain("Tax & Accounting");
        expect(phaseTitles).toContain("Distribution & Close");

        // Should NOT have probate titles
        expect(phaseTitles).not.toContain("Court Filing");
    });

    it("should include probate escalation phase when PROBATE_ESCALATION modifier present", () => {
        const roadmap = generateRoadmap("TRUST_ADMIN_REVOCABLE", "CA", ["PROBATE_ESCALATION"], ["TRUST"]);
        const phaseTitles = roadmap.map(p => p.title);
        const allTaskIds = roadmap.flatMap(p => p.tasks.map(t => t.id));

        expect(phaseTitles).toContain("⚠️ Probate Escalation");
        expect(allTaskIds).toContain("escalation_file_petition");
        expect(allTaskIds).toContain("escalation_obtain_letters");
    });

    it("should strip requiresAuthority from standard trust tasks", () => {
        const roadmap = generateRoadmap("TRUST_ADMIN_REVOCABLE", "CA", [], ["TRUST"]);
        const allTasks = roadmap.flatMap(p => p.tasks);

        // All tasks in a trust track (non-escalation) should have requiresAuthority false
        allTasks.forEach(task => {
            expect(task.requiresAuthority).toBe(false);
        });
    });
});
