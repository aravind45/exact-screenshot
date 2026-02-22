import { describe, it, expect } from "vitest";
import { generateRoadmap } from "../../config/roadmapGenerator";

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

describe("NY Roadmap Regression", () => {
    it("NY TESTATE probate: no CA strings, no DE-* forms, no Medi-Cal/DHCS", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "NY", [], ["PROBATE"], true);
        const text = collectRoadmapText(roadmap);

        expect(roadmap.some(p => p.phase === "pre_filing_compliance")).toBe(true);
        expect(text).not.toMatch(/\bDE-\d+\b/i);
        expect(text).not.toMatch(/\bMedi-Cal\b/i);
        expect(text).not.toMatch(/\bDHCS\b/i);
        expect(text).not.toMatch(/\bCalifornia\b/i);
        expect(text).not.toMatch(/\bCA Prob\. Code\b/i);
        expect(text).not.toMatch(/\bCA\b/);
    });

    it("NY TRUST_ONLY: trust tasks present, probate petition tasks absent", () => {
        const roadmap = generateRoadmap("TRUST_ADMIN_REVOCABLE", "NY", [], ["TRUST"]);
        const allTaskIds = roadmap.flatMap(p => p.tasks.map(t => t.id));

        expect(allTaskIds).toContain("locate_trust");
        expect(allTaskIds).not.toContain("file_petition");
    });
});
