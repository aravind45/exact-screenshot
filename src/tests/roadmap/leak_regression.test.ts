import { describe, it, expect } from "vitest";
import { generateRoadmap } from "../../config/roadmapGenerator";

// ─────────────────────────────────────────────────────────────────────────────
// Cross-state statute markers: each state's roadmap must NOT contain
// other states' statute citation patterns.
// ─────────────────────────────────────────────────────────────────────────────
const STATUTE_MARKERS: Record<string, RegExp[]> = {
    OH: [/ORC/, /§\s*2[01]\d{2}/],
    NJ: [/N\.J\.S\.A\./, /3B:/],
    CA: [/Prob\. Code/i, /CA Prob/i],
    GA: [/O\.C\.G\.A\./, /§\s*53-/],
    TX: [/Tex\. Est\. Code/i, /§\s*\d{3}\.\d{3}/],
    PA: [/20 Pa\.C\.S\./],
};

// Which markers must NOT appear for each state
const FORBIDDEN_MARKERS: Record<string, string[]> = {
    OH: ["NJ", "CA", "GA", "PA"],
    NJ: ["OH", "CA", "GA", "PA"],
    CA: ["OH", "NJ", "GA", "PA"],
    GA: ["OH", "NJ", "CA", "PA"],
    TX: ["OH", "NJ", "CA", "GA"],
};

// CA-only tasks that must never appear in non-CA states
const CA_ONLY_TASK_IDS = [
    "file_spousal_petition",
    "give_spousal_notice",
    "obtain_spousal_order",
    "file_succession_petition",
    "give_succession_notice",
    "obtain_succession_order",
    "prepare_notice_proposed_action",
    "wait_proposed_action_period",
    "petition_confirm_sale",
    "obtain_sale_confirmation_order",
];

// CA-only title patterns
const CA_ONLY_TITLES = [
    "Spousal Property Petition",
    "Determine Succession",
    "Notice of Proposed Action",
    "15-Day Objection",
    "Petition to Confirm Sale",
    "Sale Confirmation Order",
];

function renderRoadmapText(state: string): string {
    const roadmap = generateRoadmap("FORMAL_PROBATE", state, [], ["PROBATE"], true);
    return roadmap
        .flatMap((p) => p.tasks)
        .map((t) => `${t.id} ${t.title || ""} ${t.description || ""}`)
        .join("\n");
}

function renderRoadmapTaskIds(state: string): string[] {
    const roadmap = generateRoadmap("FORMAL_PROBATE", state, [], ["PROBATE"], true);
    return roadmap.flatMap((p) => p.tasks).map((t) => t.id);
}

describe("Leak Regression — No Cross-State Statute Leakage", () => {
    for (const [state, forbiddenStates] of Object.entries(FORBIDDEN_MARKERS)) {
        describe(`${state} roadmap`, () => {
            for (const forbiddenState of forbiddenStates) {
                const markers = STATUTE_MARKERS[forbiddenState];
                if (!markers) continue;

                it(`does NOT contain ${forbiddenState} statute markers`, () => {
                    const text = renderRoadmapText(state);
                    for (const marker of markers) {
                        // Only fail if the marker is NOT from the target state's own statutes
                        if (STATUTE_MARKERS[state]?.some((m) => m.source === marker.source)) {
                            continue; // Skip if this marker belongs to the target state itself
                        }
                        expect(text).not.toMatch(marker);
                    }
                });
            }
        });
    }
});

describe("Leak Regression — No CA Tasks in Non-CA States", () => {
    const NON_CA_STATES = ["OH", "NJ", "GA", "TX"];

    for (const state of NON_CA_STATES) {
        describe(`${state} roadmap`, () => {
            it("has 0 CA-only task IDs", () => {
                const ids = renderRoadmapTaskIds(state);
                const leaked = ids.filter((id) => CA_ONLY_TASK_IDS.includes(id));
                expect(leaked).toEqual([]);
            });

            it("has 0 CA-only title patterns", () => {
                const text = renderRoadmapText(state);
                for (const title of CA_ONLY_TITLES) {
                    expect(text).not.toContain(title);
                }
            });
        });
    }
});

describe("Leak Regression — Scope Filter Isolation", () => {
    it("OH roadmap has OH-specific tasks", () => {
        const ids = renderRoadmapTaskIds("OH");
        expect(ids).toContain("oh_certificate_of_transfer");
        expect(ids).toContain("oh_family_allowance");
    });

    it("NJ roadmap has NJ-specific tasks", () => {
        const ids = renderRoadmapTaskIds("NJ");
        expect(ids).toContain("nj_elective_share_claim");
        expect(ids).toContain("nj_real_property_transfer");
    });

    it("OH roadmap has NO NJ-specific tasks", () => {
        const ids = renderRoadmapTaskIds("OH");
        expect(ids).not.toContain("nj_elective_share_claim");
        expect(ids).not.toContain("nj_real_property_transfer");
    });

    it("NJ roadmap has NO OH-specific tasks", () => {
        const ids = renderRoadmapTaskIds("NJ");
        expect(ids).not.toContain("oh_certificate_of_transfer");
        expect(ids).not.toContain("oh_family_allowance");
    });

    it("TX roadmap has TX-specific tasks only", () => {
        const ids = renderRoadmapTaskIds("TX");
        // TX tasks should be present
        const txTasks = ids.filter((id) => id.startsWith("tx_"));
        expect(txTasks.length).toBeGreaterThan(0);
        // NJ tasks should NOT be present
        const njTasks = ids.filter((id) => id.startsWith("nj_"));
        expect(njTasks).toEqual([]);
    });
});
