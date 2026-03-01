/**
 * State Verification Test Suite
 *
 * Automated verification for ALL state fixtures. Replaces manual PDF checks.
 * Runs on every fixture in tests/roadmap_harness/fixtures/ and asserts:
 *
 *   a) No cross-state statute signatures
 *   b) PROBATE plans contain zero TRUST-scoped tasks
 *   c) No placeholder patterns '{{' (excluding known template tasks)
 *   d) No null authorityScope in config tasks
 *   e) No crashes (500s) — handler never throws
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { SETTLEMENT_PHASE_TASKS } from "@/config/settlementPhases";
import {
    filterTasksByJurisdiction,
    filterTasksByAuthorityScope,
} from "@/shared/filterByJurisdiction";

// ─── Fixture Loading ────────────────────────────────────────────────────────

interface FixtureProfile {
    id: string;
    name: string;
    stateCode: string;
    county?: string;
    authorityType: "PROBATE" | "TRUST" | "BOTH";
    hasRealProperty: boolean;
    estateValue: number;
    hasWill: boolean;
    characteristics: Record<string, boolean>;
}

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const fixtureFiles = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".json"));
const fixtures: FixtureProfile[] = fixtureFiles.map((f) =>
    JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, f), "utf-8"))
);

// ─── Cross-State Statute Signatures ─────────────────────────────────────────
const STATE_STATUTE_PATTERNS: Record<string, RegExp[]> = {
    CA: [/Probate Code §/i, /Cal\. Prob\./i, /Medi-Cal/i],
    FL: [/Florida Statutes §/i, /F\.S\. §/i, /Fla\. Stat\./i],
    NY: [/SCPA §/i, /EPTL §/i, /N\.Y\. Sur\./i],
    OH: [/Ohio Rev\. Code §/i, /O\.R\.C\. §/i, /R\.C\. §/i],
    TX: [/Texas Estates Code §/i, /Tex\. Est\./i, /TEC §/i],
    NJ: [/N\.J\.S\.A\./i, /N\.J\. Stat\./i],
    GA: [/O\.C\.G\.A\./i, /Georgia Code §/i],
    MA: [/M\.G\.L\./i, /Mass\. Gen\. Laws/i],
    MN: [/Minn\. Stat\./i, /Minnesota Statutes §/i],
};

// ─── TRUST-only task IDs ────────────────────────────────────────────────────
const TRUST_ONLY_TASK_IDS = new Set([
    "locate_trust",
    "identify_successor_trustee",
    "sign_trustee_acceptance",
    "prepare_certification_of_trust",
    "issue_cert_trust",
    "notify_trust_beneficiaries",
    "distribute_trust_assets",
    "file_trust_tax_return",
    "close_trust_accounts",
    "complete_trust_administration",
]);

// ─── Known template tasks ───────────────────────────────────────────────────
// These tasks intentionally use {{var}} patterns resolved at runtime per-state.
const KNOWN_TEMPLATE_TASKS = new Set(["file_affidavit"]);

// ─── Helpers ────────────────────────────────────────────────────────────────

function getAllTasks(): Array<any> {
    return SETTLEMENT_PHASE_TASKS.flatMap((phase: any) =>
        Array.isArray(phase.tasks) ? phase.tasks : []
    );
}

function getFilteredTasksForFixture(fixture: FixtureProfile): any[] {
    const allTasks = getAllTasks();
    const { kept: jurisdictionKept } = filterTasksByJurisdiction(
        allTasks,
        fixture.stateCode,
        fixture.county
    );
    const { kept } = filterTasksByAuthorityScope(
        jurisdictionKept,
        fixture.authorityType as any
    );
    return kept;
}

function collectAllText(task: any): string {
    const parts = [
        task.title,
        task.description,
        task.utility,
        task.rationale,
        task.conditionalRequirementLabel,
        task.primaryActionLabel,
    ];
    if (Array.isArray(task.requiredDocs)) parts.push(...task.requiredDocs);
    if (Array.isArray(task.formNames)) parts.push(...task.formNames);
    if (Array.isArray(task.alerts))
        parts.push(...task.alerts.map((a: any) => a.message));
    if (Array.isArray(task.links))
        parts.push(...task.links.map((l: any) => l.label));
    return parts.filter(Boolean).join(" ");
}

// ═══════════════════════════════════════════════════════════════════════════
// PER-FIXTURE VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

describe("State Verification Suite", () => {
    // ─── (a) No cross-state statute signatures ────────────────────────────
    describe("(a) No cross-state statute signatures", () => {
        for (const fixture of fixtures) {
            it(`${fixture.id}: no foreign statute patterns in ${fixture.stateCode} roadmap`, () => {
                const tasks = getFilteredTasksForFixture(fixture);
                const violations: string[] = [];

                for (const task of tasks) {
                    const text = collectAllText(task);
                    for (const [foreignState, patterns] of Object.entries(STATE_STATUTE_PATTERNS)) {
                        if (foreignState === fixture.stateCode) continue;
                        for (const pattern of patterns) {
                            if (pattern.test(text)) {
                                violations.push(
                                    `Task "${task.id}" contains ${foreignState} pattern: ${pattern}`
                                );
                            }
                        }
                    }
                }

                expect(violations, `Cross-state violations:\n${violations.join("\n")}`).toEqual([]);
            });
        }
    });

    // ─── (b) PROBATE plans contain zero TRUST-scoped tasks ────────────────
    describe("(b) PROBATE plans contain zero TRUST-scoped tasks", () => {
        const probateFixtures = fixtures.filter((f) => f.authorityType === "PROBATE");

        for (const fixture of probateFixtures) {
            it(`${fixture.id}: zero TRUST-only tasks in PROBATE roadmap`, () => {
                const tasks = getFilteredTasksForFixture(fixture);
                const leaks = tasks.filter((t: any) => TRUST_ONLY_TASK_IDS.has(t.id));

                expect(
                    leaks.map((t: any) => t.id),
                    `TRUST tasks leaked into PROBATE roadmap`
                ).toEqual([]);
            });
        }
    });

    // ─── (c) No placeholder patterns '{{' ─────────────────────────────────
    describe("(c) No rogue placeholder patterns '{{'", () => {
        for (const fixture of fixtures) {
            it(`${fixture.id}: no rogue '{{' placeholders in task content`, () => {
                const tasks = getFilteredTasksForFixture(fixture);
                const violations: string[] = [];

                for (const task of tasks) {
                    if (KNOWN_TEMPLATE_TASKS.has(task.id)) continue;
                    const text = collectAllText(task);
                    if (text.includes("{{")) {
                        violations.push(`Task "${task.id}" contains '{{' placeholder`);
                    }
                }

                expect(violations, `Placeholder violations:\n${violations.join("\n")}`).toEqual([]);
            });
        }

        // Audit: every task with '{{' must be registered in KNOWN_TEMPLATE_TASKS
        it("all template tasks are documented in KNOWN_TEMPLATE_TASKS", () => {
            const allTasks = getAllTasks();
            const templateTasks = allTasks.filter((t: any) => {
                const text = collectAllText(t);
                return text.includes("{{");
            });

            const templateIds = new Set(templateTasks.map((t: any) => t.id));
            for (const id of templateIds) {
                expect(
                    KNOWN_TEMPLATE_TASKS.has(id),
                    `Task "${id}" has '{{' but is NOT in KNOWN_TEMPLATE_TASKS — add it or fix the placeholder`
                ).toBe(true);
            }
        });
    });

    // ─── (d) No null authorityScope in config tasks ───────────────────────
    describe("(d) No null authorityScope in config tasks", () => {
        it("every task in SETTLEMENT_PHASE_TASKS has a valid authorityScope", () => {
            const allTasks = getAllTasks();
            const VALID_SCOPES = new Set(["PROBATE", "TRUST", "BOTH"]);
            const nullScopeTasks = allTasks.filter(
                (t: any) => !t.authorityScope || !VALID_SCOPES.has(t.authorityScope)
            );

            expect(
                nullScopeTasks.map((t: any) => `${t.id} (scope=${t.authorityScope})`),
                `Tasks with null/invalid authorityScope`
            ).toEqual([]);
        });
    });

    // ─── (e) No crashes (500s) — filter pipeline never throws ────────────
    describe("(e) No crashes — filter pipeline never throws", () => {
        for (const fixture of fixtures) {
            it(`${fixture.id}: filter pipeline completes without throwing`, () => {
                expect(() => {
                    const tasks = getFilteredTasksForFixture(fixture);
                    expect(Array.isArray(tasks)).toBe(true);
                    expect(tasks.length).toBeGreaterThan(0);
                }).not.toThrow();
            });
        }
    });

    // ─── CI Report Summary ────────────────────────────────────────────────
    describe("CI Report Summary", () => {
        it("generates per-state report data", () => {
            const stateStats = new Map<string, { total: number; probate: number; trust: number }>();

            for (const fixture of fixtures) {
                const tasks = getFilteredTasksForFixture(fixture);
                const state = fixture.stateCode;

                if (!stateStats.has(state)) {
                    stateStats.set(state, { total: 0, probate: 0, trust: 0 });
                }
                const stats = stateStats.get(state)!;
                stats.total += tasks.length;
                if (fixture.authorityType === "PROBATE") stats.probate += tasks.length;
                if (fixture.authorityType === "TRUST") stats.trust += tasks.length;
            }

            // Print summary
            console.log("\n╔══════════════════════════════════════════════╗");
            console.log("║   STATE VERIFICATION REPORT                  ║");
            console.log("╚══════════════════════════════════════════════╝");
            console.log("");
            console.log("State | Fixtures | Total Tasks | Probate | Trust");
            console.log("------|----------|-------------|---------|------");

            for (const [state, stats] of stateStats) {
                const fixtureCount = fixtures.filter((f) => f.stateCode === state).length;
                console.log(`${state}    | ${fixtureCount}        | ${stats.total}           | ${stats.probate}       | ${stats.trust}`);
            }

            // Assert all 9 states are covered
            expect(stateStats.size).toBeGreaterThanOrEqual(9);
        });
    });
});
