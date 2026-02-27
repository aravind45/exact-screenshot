import { describe, it, expect } from "vitest";
import {
    SETTLEMENT_PHASE_TASKS,
    TRUST_PHASE_TASKS,
    MODIFIER_PHASE_TASKS,
    PROBATE_ESCALATION_PHASE,
    PhaseTask,
    PhaseTaskList,
} from "../../config/settlementPhases";

// ─────────────────────────────────────────────────────────────────────────────
// Collect ALL tasks from every exported phase array
// ─────────────────────────────────────────────────────────────────────────────
function allTasks(): PhaseTask[] {
    const sources: PhaseTaskList[][] = [
        SETTLEMENT_PHASE_TASKS,
        TRUST_PHASE_TASKS,
        MODIFIER_PHASE_TASKS,
    ];
    if (PROBATE_ESCALATION_PHASE) {
        // It's a single PhaseTaskList, not an array of arrays
        sources.push([PROBATE_ESCALATION_PHASE] as any);
    }
    return sources.flat().flatMap((p) => p.tasks);
}

// ─────────────────────────────────────────────────────────────────────────────
// State statute patterns that MUST NOT appear in CORE tasks
// ─────────────────────────────────────────────────────────────────────────────
const STATE_STATUTE_PATTERNS: RegExp[] = [
    /\bORC\b/,                // Ohio Revised Code
    /\bN\.J\.S\.A\.\b/,      // New Jersey Statutes
    /\bO\.C\.G\.A\.\b/,      // Georgia
    /\b20 Pa\.C\.S\.\b/,     // Pennsylvania
    /\bProb\. Code\b/i,      // California Probate Code
    /\bTex\. Est\. Code\b/i, // Texas Estates Code
    /\bM\.G\.L\.\b/,         // Massachusetts General Laws
    /\bEPTL\b/,              // New York EPTL
    /\bSCPA\b/,              // New York SCPA
];

// State-coded ID prefixes
const STATE_ID_PREFIXES = ["tx_", "nj_", "oh_", "ga_", "ca_", "fl_", "ny_", "ma_", "pa_"];

describe("Scope Audit — Zero UNSCOPED Tasks", () => {
    const tasks = allTasks();

    it("0 tasks with scope 'UNSCOPED'", () => {
        const unscoped = tasks.filter((t) => t.scope === "UNSCOPED");
        expect(unscoped.map((t) => t.id)).toEqual([]);
    });

    it("0 tasks with missing scope", () => {
        const missing = tasks.filter((t) => !t.scope);
        expect(missing.map((t) => t.id)).toEqual([]);
    });

    it("every scope is CORE or US-{XX}", () => {
        const invalid = tasks.filter(
            (t) => t.scope !== "CORE" && !/^US-[A-Z]{2}$/.test(t.scope)
        );
        expect(invalid.map((t) => `${t.id}: ${t.scope}`)).toEqual([]);
    });
});

describe("Scope Audit — No CORE Abuse", () => {
    const tasks = allTasks();
    const coreTasks = tasks.filter((t) => t.scope === "CORE");

    it("0 CORE tasks with applicability.states", () => {
        const bad = coreTasks.filter(
            (t) => t.applicability?.states && t.applicability.states.length > 0
        );
        expect(bad.map((t) => `${t.id} states=${t.applicability?.states}`)).toEqual(
            []
        );
    });

    it("0 CORE tasks with state-coded IDs", () => {
        const bad = coreTasks.filter((t) =>
            STATE_ID_PREFIXES.some((p) => t.id.startsWith(p))
        );
        expect(bad.map((t) => t.id)).toEqual([]);
    });

    it("0 CORE tasks with state statute references in title/description", () => {
        const bad = coreTasks.filter((t) => {
            const text = `${t.title || ""} ${t.description || ""}`;
            return STATE_STATUTE_PATTERNS.some((p) => p.test(text));
        });
        expect(
            bad.map((t) => {
                const text = `${t.title || ""} ${t.description || ""}`;
                const match = STATE_STATUTE_PATTERNS.find((p) => p.test(text));
                return `${t.id}: matches ${match}`;
            })
        ).toEqual([]);
    });
});

describe("Scope Audit — State Tasks Have Correct Scope", () => {
    const tasks = allTasks();

    it("every task with applicability.states is NOT CORE", () => {
        const bad = tasks.filter(
            (t) =>
                t.scope === "CORE" &&
                t.applicability?.states &&
                t.applicability.states.length > 0
        );
        expect(bad.map((t) => t.id)).toEqual([]);
    });

    it("state-prefixed tasks have matching scope", () => {
        const prefixMap: Record<string, string> = {
            tx_: "US-TX",
            nj_: "US-NJ",
            oh_: "US-OH",
            ga_: "US-GA",
            ca_: "US-CA",
            fl_: "US-FL",
            ny_: "US-NY",
            ma_: "US-MA",
        };
        const bad = tasks.filter((t) => {
            for (const [prefix, expectedScope] of Object.entries(prefixMap)) {
                if (t.id.startsWith(prefix) && t.scope !== expectedScope) {
                    return true;
                }
            }
            return false;
        });
        expect(
            bad.map((t) => `${t.id}: scope=${t.scope}`)
        ).toEqual([]);
    });
});
