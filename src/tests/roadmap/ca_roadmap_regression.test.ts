import { describe, it, expect } from "vitest";
import { generateRoadmap } from "../../config/roadmapGenerator";
import { filterTasksForEstate } from "../../../server/services/roadmapService";
import { SETTLEMENT_PHASE_TASKS } from "../../config/settlementPhases";

function collectRoadmapText(roadmap: ReturnType<typeof generateRoadmap>) {
    const chunks: string[] = [];
    roadmap.forEach(phase => {
        phase.tasks.forEach(task => {
            if (task.title) chunks.push(task.title);
            if (task.description) chunks.push(task.description);
            if (task.requiredDocs) chunks.push(...task.requiredDocs);
            if (task.alerts) chunks.push(...task.alerts.map(a => a.message));
        });
    });
    return chunks.join(" ");
}

describe("CA Roadmap Regression", () => {
    const mockProfile = {
        id: "test-estate-ca",
        hasMinorBeneficiaries: false,
        isSmallEstate: false,
        isPrimaryResidence: false,
        isContested: false,
        state: "CA",
        estimatedValue: 500000,
        authoritySource: "COURT" as any,
        procedureType: "FORMAL_PROBATE" as any,
        distributionModel: "PROBATE" as any,
        activeEngines: ["PROBATE"],
    };

    it("CA FORMAL_PROBATE: includes CA-specific forms and language", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "CA", [], ["PROBATE"], true);
        const text = collectRoadmapText(roadmap);

        // Should include CA-specific citations
        expect(text).toMatch(/CA Prob\. Code|California Probate Code/i);
        
        // Should include DE-* form references for CA
        expect(text).toMatch(/DE-\d+/);
    });

    it("CA small estate: shows small estate affidavit tasks", () => {
        const filtered = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, {
            ...mockProfile,
            isSmallEstate: true,
            estimatedValue: 150000,
        });

        const allTaskIds = filtered.flatMap(p => p.tasks.map(t => t.id));
        
        // Should include small estate specific tasks
        expect(allTaskIds).toContain("check_small_estate_eligibility");
    });

    it("CA with minors: shows guardian ad litem tasks", () => {
        const filtered = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, {
            ...mockProfile,
            hasMinorBeneficiaries: true,
        });

        const allTaskIds = filtered.flatMap(p => p.tasks.map(t => t.id));
        
        // Should include guardian ad litem tasks
        expect(allTaskIds).toContain("identify_minor_beneficiaries");
        expect(allTaskIds).toContain("petition_guardian_ad_litem");
    });

    it("CA primary residence succession: shows succession tasks for qualifying estates", () => {
        const filtered = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, {
            ...mockProfile,
            isSmallEstate: true,
            isPrimaryResidence: true,
        });

        const allTasks = filtered.flatMap(p => p.tasks);
        const successionTask = allTasks.find(t => t.id === "file_succession_petition");
        
        // Should include succession petition task
        expect(successionTask).toBeDefined();
        // Title should reference "Real Property" 
        expect(successionTask?.title).toMatch(/Real Property/i);
    });

    it("CA contested estate: shows objection tasks", () => {
        const filtered = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, {
            ...mockProfile,
            isContested: true,
        });

        const allTaskIds = filtered.flatMap(p => p.tasks.map(t => t.id));
        
        // Should include contested probate tasks
        expect(allTaskIds).toContain("respond_to_objections");
    });

    it("CA spousal petition: recommends spousal property petition for surviving spouse", () => {
        const roadmap = generateRoadmap("SPOUSAL_PETITION", "CA", [], ["PROBATE"], true);
        const text = collectRoadmapText(roadmap);

        // Should include spousal petition references
        expect(text).toMatch(/spousal|spouse|community property/i);
    });

    it("CA creditor timing: uses correct MAX(letters+4mo, notice+60d) calculation", () => {
        // This test verifies the CA-specific creditor deadline logic
        // The deadline should be the later of:
        // - 4 months after Letters issued (120 days)
        // - 60 days after notice mailed/published
        
        const { CA_CREDITOR_TIMING } = require("../../../server/services/priority/california");
        
        expect(CA_CREDITOR_TIMING.lettersBasedDays).toBe(120);
        expect(CA_CREDITOR_TIMING.noticeBasedDays).toBe(60);
        expect(CA_CREDITOR_TIMING.calculation).toBe("MAX");
        expect(CA_CREDITOR_TIMING.citation).toBe("CA Prob. Code §9154");
    });

    it("CA county fee overrides: has CA county fee data structure", () => {
        // Verify CA county fee overrides exist
        const { CA_COUNTY_FEES } = require("../../../server/services/priority/california");
        
        expect(CA_COUNTY_FEES).toBeDefined();
        expect(Object.keys(CA_COUNTY_FEES).length).toBeGreaterThan(0);
        
        // Verify structure of a sample county
        const sampleCounty = CA_COUNTY_FEES["Los Angeles"];
        if (sampleCounty) {
            expect(sampleCounty.filingFee).toBeGreaterThan(0);
            expect(sampleCounty.citation).toBeDefined();
        }
    });

    it("CA §850 branching: supports Heggstad petitions for trust assets", () => {
        // Test for §850 (Heggstad) petition support
        // This is a CA-specific procedure for assets that should have been in a trust
        const { CA_HEGGSTAD_PROVISIONS } = require("../../../server/services/priority/california");
        
        expect(CA_HEGGSTAD_PROVISIONS).toBeDefined();
        expect(CA_HEGGSTAD_PROVISIONS.citation).toContain("850");
        expect(CA_HEGGSTAD_PROVISIONS.probateCodeSection).toBe("850");
    });

    it("CA probate vs non-probate: correctly excludes probate tasks for trust administration", () => {
        const roadmap = generateRoadmap("TRUST_ADMIN_REVOCABLE", "CA", [], ["TRUST"], true);
        const allTaskIds = roadmap.flatMap(p => p.tasks.map(t => t.id));

        // Should NOT include probate-specific tasks
        expect(allTaskIds).not.toContain("file_probate_petition");
        expect(allTaskIds).not.toContain("attend_probate_hearing");
        
        // Should include trust tasks
        expect(allTaskIds).toContain("locate_trust");
    });

    it("CA IAEA authority: includes IAEA-specific tasks when applicable", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "CA", ["IAEA_FULL"], ["PROBATE"], true);
        const text = collectRoadmapText(roadmap);

        // Should reference IAEA (Independent Administration of Estates Act)
        expect(text).toMatch(/IAEA|Independent Administration/i);
    });

    it("should not have NY-specific language in CA roadmap", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "CA", [], ["PROBATE"], true);
        const text = collectRoadmapText(roadmap);

        // Should not have NY-specific citations
        expect(text).not.toMatch(/SCPA|Surrogate's Court/i);
    });

    it("should not have TX-specific language in CA roadmap", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "CA", [], ["PROBATE"], true);
        const text = collectRoadmapText(roadmap);

        // Should not have TX-specific terms
        expect(text).not.toMatch(/Muniment of Title|Independent Administration.*Texas/i);
    });
});

describe("CA Small Estate Thresholds", () => {
    it("has correct 2025/2026 small estate threshold ($208,850)", () => {
        const { STATE_RULES } = require("../../lib/stateRules");
        
        expect(STATE_RULES["CA"].threshold).toBe(208850);
        expect(STATE_RULES["CA"].simplifiedSuccession?.personalProperty.threshold).toBe(208850);
    });

    it("has correct spousal property petition configuration", () => {
        const { STATE_RULES } = require("../../lib/stateRules");
        
        const spousalConfig = STATE_RULES["CA"].simplifiedSuccession?.spousalProperty;
        expect(spousalConfig).toBeDefined();
        expect(spousalConfig?.threshold).toBeNull(); // No dollar limit for spousal
        expect(spousalConfig?.waitingDays).toBe(0);
    });
});
