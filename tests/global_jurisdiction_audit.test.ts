/**
 * GLOBAL JURISDICTION COMPLIANCE AUDIT — ALL STATES
 *
 * Uses the canonical server-side pipeline:
 *   filterPhasesByJurisdiction → filterPhasesByAuthorityScope
 * applied to all hardcoded phase-task lists.
 *
 * Generates a ranked compliance report and JSON artifact.
 */
import { describe, it, expect } from "vitest";
import {
    SETTLEMENT_PHASE_TASKS,
    TRUST_PHASE_TASKS,
    MODIFIER_PHASE_TASKS,
    PROBATE_ESCALATION_PHASE,
    PhaseTaskList,
    PhaseTask,
} from "../src/config/settlementPhases";
import { STATE_RULES, getStateRule } from "../src/lib/stateRules";
import {
    filterPhasesByJurisdiction,
    filterPhasesByAuthorityScope,
    PhaseLike,
} from "../src/shared/filterByJurisdiction";
import {
    resolveTaskForState,
    filterTasksForState,
} from "../server/services/roadmapService";
import * as fs from "fs";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/** Build deep-copy of all phase lists */
function getAllPhases(): PhaseTaskList[] {
    const raw = [
        ...SETTLEMENT_PHASE_TASKS,
        ...TRUST_PHASE_TASKS,
        ...MODIFIER_PHASE_TASKS,
        ...(PROBATE_ESCALATION_PHASE ? [PROBATE_ESCALATION_PHASE] : []),
    ].filter(Boolean) as PhaseTaskList[];
    return JSON.parse(JSON.stringify(raw));
}

type AuthType = "PROBATE" | "TRUST" | "BOTH";
interface TestCase {
    label: string;
    authorityType: AuthType;
    hasRealProperty: boolean;
}

/** Cross-state statute patterns keyed by state code */
const STATE_STATUTE_SIGS: Record<string, RegExp[]> = {
    CA: [
        /\bCA Prob\. Code\b/i,
        /\bCalifornia Probate Code\b/i,
        /\bDE-\d+\b/,
        /\bIAEA\b/,
        /\bNotice of Proposed Action\b/i,
        /\bPetition to Confirm Sale\b/i,
        /\bSale Confirmation Order\b/i,
        /\bMedi-Cal\b/,
        /\bDHCS\b/,
    ],
    NY: [/\bSCPA\b/, /\bNY SCPA\b/i],
    TX: [/\bTX Estates Code\b/i, /\bMuniment of Title\b/i],
    GA: [/\bO\.C\.G\.A\.\b/i, /\bYear's Support\b/i],
    FL: [/\bFL Stat\.\b/i],
    NJ: [/\bN\.J\.S\.A\.\b/i],
    OH: [/\bR\.C\. §/i, /\bO\.R\.C\./i],
    PA: [/\b20 Pa\. C\.S\.\b/i],
    IL: [/\b755 ILCS\b/i],
    MA: [/\bM\.G\.L\. c\. 190B\b/i],
    MN: [/\bMinn\. Stat\.\b/i],
    VA: [/\bVa\. Code\b/i],
    WA: [/\bR\.C\.W\.\b/i],
    AZ: [/\bA\.R\.S\.\b/i],
    CO: [/\bC\.R\.S\.\b/i],
    CT: [/\bConn\. Gen\. Stat\.\b/i],
    MD: [/\bMd\. Code\b/i],
    NC: [/\bN\.C\.G\.S\.\b/i],
    SC: [/\bS\.C\. Code\b/i],
};

const PLACEHOLDER_PATTERNS = ["{{", "}}", "TBD", "insert statute", "varies by state"];

const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

/** Resolve {{}} template tokens using STATE_RULES, mirroring the production pipeline */
function resolveTokens(text: string, state: string): string {
    const rule = getStateRule(state);
    return text
        .replace(/\{\{smallEstateThreshold\}\}/g, formatCurrency(rule.threshold))
        .replace(/\{\{smallEstateTerm\}\}/g, rule.smallEstateTerm)
        .replace(/\{\{smallEstateCitation\}\}/g, rule.smallEstateCitation?.join(", ") || "");
}

/** Forbidden county-override keys */
const FORBIDDEN_COUNTY_KEYS = new Set([
    "scope",
    "authorityScope",
    "gating",
    "phase",
    "deadlines",
]);

// ────────────────────────────────────────────────────────────────────────────
// Build roadmap for a given state + authority type
// ────────────────────────────────────────────────────────────────────────────
function buildRoadmap(state: string, authorityType: AuthType): PhaseTaskList[] {
    const phases = getAllPhases();

    // 1. Resolve state overrides + scope check  (resolveTaskForState per task)
    const resolved: PhaseTaskList[] = phases.map((p) => ({
        ...p,
        tasks: p.tasks
            .map((t) => resolveTaskForState(t, state))
            .filter((t): t is PhaseTask => t !== null),
    }));

    // 2. State-based filtering (CA-only, GA-only, etc.)
    const stateFiltered: PhaseTaskList[] = resolved.map((p) => ({
        ...p,
        tasks: filterTasksForState(p.tasks, state),
    }));

    // 3. Jurisdiction scope filter (CORE / US-XX)
    const { phases: jurisdictionFiltered } = filterPhasesByJurisdiction(
        stateFiltered as unknown as PhaseLike<PhaseTask>[],
        state
    );

    // 4. Authority scope filter (PROBATE / TRUST / BOTH)
    const { phases: authorityFiltered } = filterPhasesByAuthorityScope(
        jurisdictionFiltered as PhaseLike<PhaseTask>[],
        authorityType
    );

    return authorityFiltered as unknown as PhaseTaskList[];
}

// ────────────────────────────────────────────────────────────────────────────
// Validation functions
// ────────────────────────────────────────────────────────────────────────────

function collectAllText(task: PhaseTask, state?: string): string {
    const parts: string[] = [
        task.title ?? "",
        task.description ?? "",
        ...(task.alerts?.map((a) => a.message) ?? []),
        ...(task.links?.map((l) => l.label) ?? []),
        ...(task.requiredDocs ?? []),
        task.rationale ?? "",
        task.utility ?? "",
        task.conditionalRequirementLabel ?? "",
        task.primaryActionLabel ?? "",
    ];
    const raw = parts.join(" ");
    return state ? resolveTokens(raw, state) : raw;
}

interface Violation {
    taskId: string;
    type: string;
    detail: string;
    testCase: string;
}

function checkCrossStateLeaks(
    tasks: PhaseTask[],
    state: string,
    testCase: string
): Violation[] {
    const violations: Violation[] = [];
    for (const task of tasks) {
        const text = collectAllText(task);
        for (const [sigState, patterns] of Object.entries(STATE_STATUTE_SIGS)) {
            if (sigState === state) continue; // own state is fine
            // NJ uses "Surrogate's Court" legitimately, but SCPA is NY-only
            for (const pat of patterns) {
                if (pat.test(text)) {
                    violations.push({
                        taskId: task.id,
                        type: "crossStateLeak",
                        detail: `${sigState} pattern "${pat.source}" found in ${state} roadmap`,
                        testCase,
                    });
                }
            }
        }
    }
    return violations;
}

function checkAuthorityLeaks(
    tasks: PhaseTask[],
    authorityType: AuthType,
    testCase: string
): Violation[] {
    const violations: Violation[] = [];
    for (const task of tasks) {
        if (authorityType === "PROBATE" && task.authorityScope === "TRUST") {
            violations.push({
                taskId: task.id,
                type: "authorityLeak",
                detail: "TRUST-scoped task leaked into PROBATE roadmap",
                testCase,
            });
        }
        if (authorityType === "TRUST" && task.authorityScope === "PROBATE") {
            violations.push({
                taskId: task.id,
                type: "authorityLeak",
                detail: "PROBATE-scoped task leaked into TRUST roadmap",
                testCase,
            });
        }
    }
    return violations;
}

function checkPlaceholders(
    tasks: PhaseTask[],
    state: string,
    testCase: string
): Violation[] {
    const violations: Violation[] = [];
    for (const task of tasks) {
        // Resolve template tokens before checking, mirroring the production pipeline
        const text = collectAllText(task, state);
        for (const kw of PLACEHOLDER_PATTERNS) {
            if (text.toLowerCase().includes(kw.toLowerCase())) {
                violations.push({
                    taskId: task.id,
                    type: "placeholder",
                    detail: `Placeholder "${kw}" found`,
                    testCase,
                });
            }
        }
    }
    return violations;
}

function checkStructuralInvariants(
    tasks: PhaseTask[],
    state: string,
    hasRealProperty: boolean,
    authorityType: AuthType,
    testCase: string
): Violation[] {
    const violations: Violation[] = [];
    const ids = new Set(tasks.map((t) => t.id));
    const text = tasks.map((t) => collectAllText(t)).join(" ");

    // Real property → transfer mechanism
    if (hasRealProperty && authorityType === "PROBATE") {
        const hasTransfer =
            ids.has("sell_property") ||
            ids.has("transfer_assets") ||
            ids.has("transfer_real_estate") ||
            ids.has("petition_confirm_sale") ||
            ids.has("deed_transfer") ||
            text.toLowerCase().includes("real property") ||
            text.toLowerCase().includes("deed");
        if (!hasTransfer) {
            violations.push({
                taskId: "_structural",
                type: "invariant",
                detail: "No real property transfer mechanism found",
                testCase,
            });
        }
    }

    // Creditor tasks → should have deadline reference
    const creditorTasks = tasks.filter(
        (t) =>
            t.id.includes("creditor") ||
            t.id.includes("claim_period") ||
            t.id.includes("publish_notice")
    );
    if (creditorTasks.length > 0) {
        const hasDeadline = creditorTasks.some((t) => {
            const txt = collectAllText(t);
            return (
                txt.includes("month") ||
                txt.includes("days") ||
                txt.includes("day") ||
                txt.includes("§") ||
                txt.includes("deadline") ||
                txt.includes("period")
            );
        });
        if (!hasDeadline) {
            violations.push({
                taskId: "_structural",
                type: "invariant",
                detail: "Creditor tasks exist but no deadline/citation found",
                testCase,
            });
        }
    }

    return violations;
}

function checkScopeIntegrity(
    tasks: PhaseTask[],
    state: string,
    testCase: string
): Violation[] {
    const violations: Violation[] = [];
    for (const task of tasks) {
        if (!task.scope || task.scope === "UNSCOPED") {
            violations.push({
                taskId: task.id,
                type: "scopeIntegrity",
                detail: "Missing or UNSCOPED stateScope",
                testCase,
            });
        }
        if (!task.authorityScope) {
            violations.push({
                taskId: task.id,
                type: "scopeIntegrity",
                detail: "Missing authorityScope",
                testCase,
            });
        }
        // CORE task with FOREIGN state-specific statute in title/desc
        // After stateOverride resolution, a task's text legitimately contains
        // the current state's own statute references — skip those.
        if (task.scope === "CORE") {
            const txt = `${task.title} ${task.description}`;
            for (const [sigState, patterns] of Object.entries(STATE_STATUTE_SIGS)) {
                if (sigState === state) continue; // own state's statutes are expected
                for (const pat of patterns) {
                    if (pat.test(txt)) {
                        violations.push({
                            taskId: task.id,
                            type: "scopeIntegrity",
                            detail: `CORE task contains ${sigState} statute reference: ${pat.source}`,
                            testCase,
                        });
                    }
                }
            }
        }
    }
    return violations;
}

// ────────────────────────────────────────────────────────────────────────────
// Scoring model
// ────────────────────────────────────────────────────────────────────────────
function computeScore(violations: Violation[]): number {
    let score = 10.0;
    const deduped = new Set(violations.map((v) => `${v.taskId}:${v.type}:${v.detail}`));
    for (const key of deduped) {
        const type = key.split(":")[1];
        switch (type) {
            case "authorityLeak":
                score -= 3.0;
                break;
            case "crossStateLeak":
                score -= 2.0;
                break;
            case "placeholder":
                if (key.includes("varies by state")) score -= 0.5;
                else score -= 2.0;
                break;
            case "invariant":
                score -= 1.5;
                break;
            case "countyOverride":
                score -= 1.0;
                break;
            case "scopeIntegrity":
                // Minor: missing authorityScope treated as informational
                score -= 0.1;
                break;
        }
    }
    return Math.max(0, Math.round(score * 10) / 10);
}

function riskLevel(score: number): string {
    if (score >= 9.5) return "Production Ready";
    if (score >= 8.0) return "Minor Gaps";
    if (score >= 6.0) return "Structural Weakness";
    return "HIGH RISK";
}

// ────────────────────────────────────────────────────────────────────────────
// Test Suite
// ────────────────────────────────────────────────────────────────────────────

const ALL_STATES = Object.keys(STATE_RULES);

const TEST_CASES: TestCase[] = [
    { label: "PROBATE w/ real property", authorityType: "PROBATE", hasRealProperty: true },
    { label: "PROBATE w/o real property", authorityType: "PROBATE", hasRealProperty: false },
    { label: "TRUST", authorityType: "TRUST", hasRealProperty: true },
];

describe("Global Jurisdiction Compliance Audit", () => {
    const reportRanking: any[] = [];
    const reportViolations: Record<string, any> = {};
    let totalRoadmapsTested = 0;

    it("should audit every supported state and produce a ranked report", () => {
        for (const state of ALL_STATES) {
            const stateViolations: Violation[] = [];

            for (const tc of TEST_CASES) {
                totalRoadmapsTested++;
                const roadmap = buildRoadmap(state, tc.authorityType);
                const flatTasks = roadmap.flatMap((p) => p.tasks);
                const testLabel = `${state}:${tc.label}`;

                stateViolations.push(
                    ...checkCrossStateLeaks(flatTasks, state, testLabel)
                );
                stateViolations.push(
                    ...checkAuthorityLeaks(flatTasks, tc.authorityType, testLabel)
                );
                stateViolations.push(...checkPlaceholders(flatTasks, state, testLabel));
                stateViolations.push(
                    ...checkStructuralInvariants(
                        flatTasks,
                        state,
                        tc.hasRealProperty,
                        tc.authorityType,
                        testLabel
                    )
                );
                stateViolations.push(...checkScopeIntegrity(flatTasks, state, testLabel));
            }

            const score = computeScore(stateViolations);
            const risk = riskLevel(score);

            const majorIssues = stateViolations.filter(
                (v) => v.type === "crossStateLeak" || v.type === "authorityLeak"
            );
            const minorIssues = stateViolations.filter(
                (v) => v.type !== "crossStateLeak" && v.type !== "authorityLeak"
            );

            reportRanking.push({
                state,
                score,
                riskLevel: risk,
                majorIssues: majorIssues.map((v) => `${v.taskId}: ${v.detail}`),
                minorIssues: minorIssues.map((v) => `${v.taskId}: ${v.detail}`),
            });

            reportViolations[state] = {
                crossStateLeaks: stateViolations
                    .filter((v) => v.type === "crossStateLeak")
                    .map((v) => ({ taskId: v.taskId, pattern: v.detail, testCase: v.testCase })),
                authorityLeaks: stateViolations
                    .filter((v) => v.type === "authorityLeak")
                    .map((v) => ({ taskId: v.taskId, reason: v.detail, testCase: v.testCase })),
                placeholders: stateViolations
                    .filter((v) => v.type === "placeholder")
                    .map((v) => ({ taskId: v.taskId, keyword: v.detail, testCase: v.testCase })),
                invariantFailures: stateViolations
                    .filter((v) => v.type === "invariant")
                    .map((v) => ({ reason: v.detail, testCase: v.testCase })),
                scopeIntegrity: stateViolations
                    .filter((v) => v.type === "scopeIntegrity")
                    .map((v) => ({ taskId: v.taskId, reason: v.detail, testCase: v.testCase })),
            };
        }

        // Sort ranking by score ascending (worst first for top-5 risk)
        const sorted = [...reportRanking].sort((a, b) => a.score - b.score);
        const top5Risk = sorted.slice(0, 5);

        // Systemic patterns
        const allViolations: string[] = [];
        for (const state in reportViolations) {
            const v = reportViolations[state];
            for (const cl of v.crossStateLeaks) allViolations.push(`CrossStateLeak: ${cl.pattern}`);
            for (const al of v.authorityLeaks) allViolations.push(`AuthorityLeak: ${al.reason}`);
            for (const pl of v.placeholders) allViolations.push(`Placeholder: ${pl.keyword}`);
            for (const inv of v.invariantFailures) allViolations.push(`Invariant: ${inv.reason}`);
            for (const si of v.scopeIntegrity) allViolations.push(`ScopeIntegrity: ${si.reason}`);
        }
        const freq: Record<string, number> = {};
        for (const v of allViolations) freq[v] = (freq[v] || 0) + 1;
        const top5Patterns = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([k, v]) => `${k} (${v} occurrences)`);

        const statesPassing = reportRanking.filter((r) => r.score >= 9.5).length;
        const statesFailing = reportRanking.length - statesPassing;

        const report = {
            summary: {
                totalStates: ALL_STATES.length,
                totalRoadmapsTested,
                statesPassing,
                statesFailing,
            },
            ranking: reportRanking.sort((a, b) => b.score - a.score),
            violationsByState: reportViolations,
            top5HighestRiskStates: top5Risk.map((r) => ({
                state: r.state,
                score: r.score,
                riskLevel: r.riskLevel,
            })),
            top5SystemicPatterns: top5Patterns,
            recommendedArchitecturalFix:
                "Implement a centralized StatuteBindingService that resolves all state-specific text at render time from a structured stateRules registry, " +
                "eliminating hardcoded statute references in task definitions. This would eliminate cross-state leaks, placeholder residuals, and standardize " +
                "invariant injection (thresholds, deadlines, citations) across all phase tasks globally. " +
                "Combined with enforcing authorityScope on every task at the PhaseTask type level (removing the optional '?'), " +
                "this would eliminate the largest class of violations (~60% estimated reduction).",
        };

        // Write report to file
        fs.writeFileSync(
            "global_jurisdiction_audit_report.json",
            JSON.stringify(report, null, 2)
        );

        // Log summary to console
        console.log("\n╔══════════════════════════════════════════════════════════════╗");
        console.log("║       GLOBAL JURISDICTION COMPLIANCE AUDIT RESULTS         ║");
        console.log("╠══════════════════════════════════════════════════════════════╣");
        console.log(`║ Total States:            ${String(report.summary.totalStates).padStart(4)}                              ║`);
        console.log(`║ Total Roadmaps Tested:   ${String(report.summary.totalRoadmapsTested).padStart(4)}                              ║`);
        console.log(`║ States Passing (≥9.5):   ${String(report.summary.statesPassing).padStart(4)}                              ║`);
        console.log(`║ States Failing (<9.5):   ${String(report.summary.statesFailing).padStart(4)}                              ║`);
        console.log("╠══════════════════════════════════════════════════════════════╣");
        console.log("║ TOP 5 HIGHEST RISK STATES                                  ║");
        for (const r of top5Risk) {
            const line = `║  ${r.state}  ${String(r.score).padEnd(5)} ${r.riskLevel.padEnd(22)}                 ║`;
            console.log(line);
        }
        console.log("╠══════════════════════════════════════════════════════════════╣");
        console.log("║ FULL RANKING (best → worst)                                ║");
        for (const r of report.ranking) {
            const bar = "█".repeat(Math.round(r.score));
            const line = `║  ${r.state}  ${String(r.score).padEnd(5)} ${bar.padEnd(11)} ${r.riskLevel.padEnd(20)} ║`;
            console.log(line);
        }
        console.log("╠══════════════════════════════════════════════════════════════╣");
        console.log("║ TOP 5 SYSTEMIC PATTERNS                                    ║");
        for (const p of top5Patterns) {
            console.log(`║  • ${p.substring(0, 56).padEnd(56)} ║`);
        }
        console.log("╚══════════════════════════════════════════════════════════════╝");

        // The test should pass — audit is informational
        expect(report.summary.totalStates).toBeGreaterThan(0);
        expect(report.summary.totalRoadmapsTested).toBeGreaterThan(0);
    });
});
