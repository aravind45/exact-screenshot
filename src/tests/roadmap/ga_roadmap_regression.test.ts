import { describe, it, expect } from "vitest";
import { STATE_RULES } from "../../lib/stateRules";
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

describe("GA Roadmap Compliance", () => {
    const mockProfile = {
        id: "test-estate-ga",
        hasMinorBeneficiaries: false,
        isSmallEstate: false,
        isPrimaryResidence: false,
        isContested: false,
        state: "GA",
        estimatedValue: 500000,
        authoritySource: "COURT" as any,
        procedureType: "FORMAL_PROBATE" as any,
        distributionModel: "PROBATE" as any,
        activeEngines: ["PROBATE"],
    };

    it("GA STATE_RULES: has correct creditor timing fields", () => {
        const ga = STATE_RULES["GA"];
        expect(ga.claimWindowDays).toBe(90); // 3 months
        expect(ga.smallEstateTerm).toBe("No Administration Necessary");
    });

    it("GA creditor deadline: publication Jan 1 → deadline April 1", () => {
        const publicationDate = new Date("2024-01-01");
        const ga = STATE_RULES["GA"];
        
        const deadline = new Date(publicationDate);
        deadline.setDate(deadline.getDate() + (ga.claimWindowDays || 90));
        
        expect(deadline.getMonth()).toBe(3); // April (0-indexed)
        expect(deadline.getDate()).toBe(1);
    });

    it("GA roadmap: Year's Support tasks exist", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "GA", [], ["PROBATE"], true);
        const allTasks = roadmap.flatMap(phase => phase.tasks);
        
        const yearsSupportPetition = allTasks.find(t => t.id === "ga_years_support_petition");
        expect(yearsSupportPetition).toBeDefined();
        expect(yearsSupportPetition?.title).toContain("Year's Support");
        expect(yearsSupportPetition?.description).toContain("O.C.G.A. §53-3-1");
    });

    it("GA roadmap: Deed of Assent task exists", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "GA", [], ["PROBATE"], true);
        const allTasks = roadmap.flatMap(phase => phase.tasks);
        
        const deedOfAssent = allTasks.find(t => t.id === "ga_deed_of_assent");
        expect(deedOfAssent).toBeDefined();
        expect(deedOfAssent?.title).toContain("Deed of Assent");
        expect(deedOfAssent?.description).toContain("O.C.G.A. §53-8-15");
    });

    it("GA roadmap: creditor tasks have correct O.C.G.A. citations", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "GA", [], ["PROBATE"], true);
        const allTasks = roadmap.flatMap(phase => phase.tasks);
        
        const creditorMonitor = allTasks.find(t => t.id === "monitor_creditor_claim_period");
        expect(creditorMonitor?.description).toContain("O.C.G.A. §53-7-41");
    });

    it("GA roadmap: publish_notice has GA override marking it required", () => {
        const filtered = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, mockProfile);
        const allTasks = filtered.flatMap(p => p.tasks);
        
        const publishNotice = allTasks.find(t => t.id === "publish_notice");
        expect(publishNotice?.title).toContain("Required");
    });

    it("GA roadmap: small estate uses 'No Administration Necessary'", () => {
        const ga = STATE_RULES["GA"];
        expect(ga.smallEstateTerm).toBe("No Administration Necessary");
    });

    it("should not have CA-specific language in GA roadmap", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "GA", [], ["PROBATE"], true);
        const text = collectRoadmapText(roadmap);

        // Should not have CA-specific citations
        expect(text).not.toMatch(/CA Prob\. Code|California Probate Code/i);
        expect(text).not.toMatch(/IAEA|Independent Administration of Estates Act/i);
    });

    it("should not have TX-specific language in GA roadmap", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "GA", [], ["PROBATE"], true);
        const text = collectRoadmapText(roadmap);
        // Should not have TX-specific terms
        expect(text).not.toMatch(/Muniment of Title|Independent Administration.*Texas/i);
    });
});