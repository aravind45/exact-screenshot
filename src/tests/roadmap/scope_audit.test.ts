import { describe, it, expect } from "vitest";
import {
    SETTLEMENT_PHASE_TASKS,
    TRUST_PHASE_TASKS,
    MODIFIER_PHASE_TASKS,
    PROBATE_ESCALATION_PHASE,
    PhaseTask,
    PhaseTaskList,
} from "../../config/settlementPhases";
import type { AuthorityScope } from "../../types/authorityScope";

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

describe("Authority Scope Audit — Task Coverage", () => {
    const tasks = allTasks();

    it("every task with trackCompatibility=TRUST has authorityScope defined", () => {
        const trustTasks = tasks.filter(t =>
            t.trackCompatibility?.includes("TRUST")
        );
        const trustTasksWithoutScope = trustTasks.filter(t =>
            t.authorityScope === undefined
        );
        expect(trustTasksWithoutScope.map(t => t.id)).toEqual([]);
    });

    it("every task with trackCompatibility=PROBATE has authorityScope defined", () => {
        const probateTasks = tasks.filter(t =>
            t.trackCompatibility?.includes("PROBATE")
        );
        const probateTasksWithoutScope = probateTasks.filter(t =>
            t.authorityScope === undefined
        );
        expect(probateTasksWithoutScope.map(t => t.id)).toEqual([]);
    });

    it("tasks with authorityScope=TRUST must not have trackCompatibility=PROBATE", () => {
        const trustOnlyTasks = tasks.filter(t =>
            t.authorityScope === "TRUST"
        );
        const bad = trustOnlyTasks.filter(t =>
            t.trackCompatibility?.includes("PROBATE") || t.trackCompatibility?.includes("AFFIDAVIT")
        );
        expect(bad.map(t => `${t.id}: authorityScope=${t.authorityScope} but trackCompatibility=${t.trackCompatibility}`)).toEqual([]);
    });

    it("tasks with authorityScope=PROBATE must not have trackCompatibility=TRUST", () => {
        const probateOnlyTasks = tasks.filter(t =>
            t.authorityScope === "PROBATE"
        );
        const bad = probateOnlyTasks.filter(t =>
            t.trackCompatibility?.includes("TRUST")
        );
        expect(bad.map(t => `${t.id}: authorityScope=${t.authorityScope} but trackCompatibility=${t.trackCompatibility}`)).toEqual([]);
    });

    it("all tasks have valid authorityScope values", () => {
        const validScopes: AuthorityScope[] = ["PROBATE", "TRUST", "BOTH"];
        const tasksWithInvalidScope = tasks.filter(task => {
            if (!task.authorityScope) return false; // Backward compatibility allowed
            return !validScopes.includes(task.authorityScope);
        });
        expect(tasksWithInvalidScope.map(t => `${t.id}: ${task.authorityScope}`)).toEqual([]);
    });
});
