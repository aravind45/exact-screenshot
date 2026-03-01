import { describe, it, expect } from "vitest";
import { generateRoadmap } from "../../config/roadmapGenerator";

/**
 * Minimum Intake Gate Tests
 *
 * Verifies that the completeness gate logic is sound and that
 * UNSET/incomplete estates cannot produce trust-contaminated roadmaps
 * via the client-side generator.
 *
 * The server-side 409 gate is the primary enforcement mechanism;
 * these tests guard the client-side fallback generator.
 */

describe("Minimum Intake Gate — completeness level semantics", () => {
    it("PROBATE-only roadmap has zero trust-specific tasks", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "CA", [], ["PROBATE"]);
        const allTasks = roadmap.flatMap((p) => p.tasks);

        const trustTasks = allTasks.filter((t) => {
            const text = `${t.id} ${t.title ?? ""} ${t.description ?? ""}`.toLowerCase();
            return (
                text.includes("trustee acceptance") ||
                text.includes("certification of trust") ||
                text.includes("locate_trust")
            );
        });

        expect(trustTasks).toHaveLength(0);
    });

    it("TRUST-only roadmap has zero probate court filing tasks", () => {
        const roadmap = generateRoadmap("TRUST_ADMIN_REVOCABLE", "CA", [], ["TRUST"]);
        const allTaskIds = roadmap.flatMap((p) => p.tasks.map((t) => t.id));

        expect(allTaskIds).not.toContain("file_probate_petition");
        expect(allTaskIds).not.toContain("file_administration_petition");
    });

    it("PROBATE roadmap phases contain at least one task", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "TX", [], ["PROBATE"]);
        const emptyPhases = roadmap.filter((p) => p.tasks.length === 0);
        expect(emptyPhases).toHaveLength(0);
    });

    it("TRUST roadmap phases contain at least one task", () => {
        const roadmap = generateRoadmap("TRUST_ADMIN_REVOCABLE", "TX", [], ["TRUST"]);
        const emptyPhases = roadmap.filter((p) => p.tasks.length === 0);
        expect(emptyPhases).toHaveLength(0);
    });
});

describe("Minimum Intake Gate — authority type isolation", () => {
    it("PROBATE roadmap does not contain locate_trust or sign_trustee_acceptance", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "CA", [], ["PROBATE"]);
        const allTaskIds = roadmap.flatMap((p) => p.tasks.map((t) => t.id));

        expect(allTaskIds).not.toContain("locate_trust");
        expect(allTaskIds).not.toContain("sign_trustee_acceptance");
        expect(allTaskIds).not.toContain("prepare_certification_of_trust");
    });

    it("PROBATE roadmap for CA includes probate court filing tasks", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "CA", [], ["PROBATE"]);
        const allTaskIds = roadmap.flatMap((p) => p.tasks.map((t) => t.id));

        expect(
            allTaskIds.includes("file_probate_petition") ||
            allTaskIds.includes("file_administration_petition")
        ).toBe(true);
    });

    it("mixed BOTH roadmap includes tasks from each engine", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "CA", [], ["PROBATE", "TRUST"]);
        const allTaskIds = roadmap.flatMap((p) => p.tasks.map((t) => t.id));

        expect(
            allTaskIds.includes("file_probate_petition") ||
            allTaskIds.includes("file_administration_petition")
        ).toBe(true);
        expect(allTaskIds).toContain("locate_trust");
    });
});
