import { describe, it, expect } from "vitest";
import { generateRoadmap } from "../../config/roadmapGenerator";

describe("NJ Roadmap Compliance - Structural Isolation", () => {
    it("NO CA spousal property petition in NJ roadmap", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "NJ", [], ["PROBATE"], true);
        const allTasks = roadmap.flatMap(phase => phase.tasks);

        expect(allTasks.find(t => t.id === "file_spousal_petition")).toBeUndefined();
        expect(allTasks.find(t => t.id === "obtain_spousal_order")).toBeUndefined();
        expect(allTasks.map(t => t.title)).not.toContain("Spousal Property Petition");
    });

    it("NO succession petition in NJ roadmap", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "NJ", [], ["PROBATE"], true);
        const allTasks = roadmap.flatMap(phase => phase.tasks);

        expect(allTasks.find(t => t.id === "file_succession_petition")).toBeUndefined();
        expect(allTasks.find(t => t.id === "obtain_succession_order")).toBeUndefined();
        // Use part of the title since it might have (NJ) or similar
        const titles = allTasks.map(t => t.title);
        expect(titles.some(title => title.includes("Determine Succession"))).toBe(false);
    });

    it("NO {{smallEstateTerm}} placeholder in NJ roadmap titles/descriptions", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "NJ", [], ["PROBATE"], true);
        const text = roadmap.flatMap(p => p.tasks).map(t => (t.title || "") + " " + (t.description || "")).join(" ");

        expect(text).not.toContain("{{smallEstateTerm}}");
    });

    it("NO generic monitor-state-specific placeholder", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "NJ", [], ["PROBATE"], true);
        const text = roadmap.flatMap(p => p.tasks).map(t => (t.title || "") + " " + (t.description || "")).join(" ");

        expect(text).not.toContain("Monitor State-Specific");
    });

    it("NJ Elective Share task exists", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "NJ", [], ["PROBATE"], true);
        const allTasks = roadmap.flatMap(phase => phase.tasks);

        const task = allTasks.find(t => t.id === "nj_elective_share_claim");
        expect(task).toBeDefined();
        expect(task?.title).toContain("Elective Share Claim");
        expect(task?.description).toContain("N.J.S.A. 3B:8-1");
    });

    it("NJ Real Property Transfer task exists", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "NJ", [], ["PROBATE"], true);
        const allTasks = roadmap.flatMap(phase => phase.tasks);

        const task = allTasks.find(t => t.id === "nj_real_property_transfer");
        expect(task).toBeDefined();
        expect(task?.title).toContain("Executor’s Deed");
    });

    it("NJ Creditor period uses correct statutory logic", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "NJ", [], ["PROBATE"], true);
        const allTasks = roadmap.flatMap(phase => phase.tasks);

        const task = allTasks.find(t => t.id === "publish_notice");
        expect(task).toBeDefined();
        expect(task?.title).toContain("N.J.S.A. 3B:22-4");
        expect(task?.description).toContain("6 months");
    });

    it("NO generic 'varies by state' language in NJ roadmap", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "NJ", [], ["PROBATE"], true);
        const text = roadmap.flatMap(p => p.tasks).map(t => JSON.stringify(t)).join(" ");

        expect(text).not.toContain("varies by state");
        expect(text).not.toContain("jurisdiction");
    });

    it("STRICT GATING: Probate track hides trust-only tasks", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "NJ", [], ["PROBATE"], true);
        const allTasks = roadmap.flatMap(phase => phase.tasks);

        expect(allTasks.find(t => t.id === "prepare_certification_of_trust")).toBeUndefined();
        expect(allTasks.find(t => t.id === "sign_trustee_acceptance")).toBeUndefined();
        expect(allTasks.find(t => t.title?.includes("Trust accounting"))).toBeUndefined();
    });

    it("STRICT GATING: Trust track hides probate-only tasks", () => {
        const roadmap = generateRoadmap("TRUST_ADMIN_REVOCABLE", "NJ", [], ["TRUST"], true);
        const allTasks = roadmap.flatMap(phase => phase.tasks);

        expect(allTasks.find(t => t.id === "file_probate_petition")).toBeUndefined();
        expect(allTasks.find(t => t.title?.includes("Letters Test"))).toBeUndefined();
        expect(allTasks.find(t => t.category === "probate")).toBeUndefined();
    });

    it("Contains all mandatory NJ primary statutes", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "NJ", [], ["PROBATE"], true);
        const text = JSON.stringify(roadmap);

        expect(text).toContain("3B:15-1"); // Inventory
        expect(text).toContain("3B:22-4"); // Creditor
        expect(text).toContain("3B:8-1");  // Elective Share
        expect(text).toContain("3B:15-3"); // Bond/Family Allowance context
    });
});
