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

describe("OH Roadmap Compliance", () => {
    const mockProfile = {
        id: "test-estate-oh",
        hasMinorBeneficiaries: false,
        isSmallEstate: false,
        isPrimaryResidence: false,
        isContested: false,
        state: "OH",
        estimatedValue: 500000,
        authoritySource: "COURT" as any,
        procedureType: "FORMAL_PROBATE" as any,
        distributionModel: "PROBATE" as any,
        activeEngines: ["PROBATE"],
        isOH: true,
    };

    it("OH STATE_RULES: has correct creditor timing fields", () => {
        const oh = STATE_RULES["OH"];
        expect(oh.claimWindowDays).toBe(180); // 6 months
        expect(oh.smallEstateTerm).toBe("Release from Administration");
        expect(oh.threshold).toBe(35000);
    });

    it("OH creditor deadline: date of death Jan 1 -> deadline approximately 6 months later", () => {
        const dateOfDeath = new Date("2024-01-01");
        const oh = STATE_RULES["OH"];
        
        const deadline = new Date(dateOfDeath);
        deadline.setDate(deadline.getDate() + (oh.claimWindowDays || 180));
        
        // 180 days from Jan 1 is approximately June 30 (leap year)
        // In non-leap years it's around July 1
        expect(deadline.getMonth()).toBeGreaterThanOrEqual(5); // June or July (0-indexed)
        expect(deadline.getMonth()).toBeLessThanOrEqual(6); 
    });

    it("OH roadmap: No NJ statute leakage in creditor tasks", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "OH", [], ["PROBATE"], true);
        const allTasks = roadmap.flatMap(phase => phase.tasks);
        
        const creditorMonitor = allTasks.find(t => t.id === "monitor_creditor_claim_period");
        expect(creditorMonitor?.title).not.toContain("N.J.S.A.");
        expect(creditorMonitor?.description).not.toContain("N.J.S.A.");
        expect(creditorMonitor?.title).toContain("Ohio");
    });

    it("OH roadmap: Release from Administration appears (not Small Estate Affidavit)", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "OH", [], ["PROBATE"], true);
        const allTasks = roadmap.flatMap(phase => phase.tasks);
        
        const fileAffidavit = allTasks.find(t => t.id === "file_affidavit");
        expect(fileAffidavit).toBeDefined();
        expect(fileAffidavit?.title).toContain("Release from Administration");
    });

    it("OH roadmap: Spousal property petition should be hidden", () => {
        const filteredPhases = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, mockProfile, []);
        const allTasks = filteredPhases.flatMap(phase => phase.tasks);
        
        const spousalPetition = allTasks.find(t => t.id === "file_spousal_petition");
        expect(spousalPetition).toBeUndefined();
    });

    it("OH roadmap: Succession petition should be hidden", () => {
        const filteredPhases = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, mockProfile, []);
        const allTasks = filteredPhases.flatMap(phase => phase.tasks);
        
        const successionPetition = allTasks.find(t => t.id === "file_succession_petition");
        expect(successionPetition).toBeUndefined();
    });

    it("OH roadmap: Generic wait_claim_period should be hidden (has state-specific override)", () => {
        const filteredPhases = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, mockProfile, []);
        const allTasks = filteredPhases.flatMap(phase => phase.tasks);
        
        const waitClaim = allTasks.find(t => t.id === "wait_claim_period");
        expect(waitClaim).toBeUndefined();
    });

    it("OH roadmap: monitor_creditor_claim_period should show OH-specific content", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "OH", [], ["PROBATE"], true);
        const allTasks = roadmap.flatMap(phase => phase.tasks);
        
        const creditorMonitor = allTasks.find(t => t.id === "monitor_creditor_claim_period");
        expect(creditorMonitor).toBeDefined();
        expect(creditorMonitor?.description).toContain("ORC 2117.06");
    });
});
