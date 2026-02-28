import { describe, it } from "vitest";
import {
    SETTLEMENT_PHASE_TASKS,
    TRUST_PHASE_TASKS,
    MODIFIER_PHASE_TASKS,
    PROBATE_ESCALATION_PHASE,
    PhaseTask,
    PhaseTaskList
} from '../src/config/settlementPhases';

function allTasks(): PhaseTask[] {
    const sources: PhaseTaskList[][] = [
        SETTLEMENT_PHASE_TASKS,
        TRUST_PHASE_TASKS,
        MODIFIER_PHASE_TASKS,
    ];
    if (PROBATE_ESCALATION_PHASE) {
        sources.push([PROBATE_ESCALATION_PHASE] as any);
    }
    return sources.flat().flatMap((p) => p.tasks);
}

describe("Final Authority Scope Audit", () => {
    it("identifies all remaining tasks needing authorityScope", () => {
        const tasks = allTasks();

        const missingTrust = tasks.filter(t =>
            t.trackCompatibility?.includes("TRUST") && t.authorityScope === undefined
        );

        const missingProbate = tasks.filter(t =>
            t.trackCompatibility?.includes("PROBATE") && t.authorityScope === undefined
        );

        const fs = require('fs');
        let output = "Tasks with trackCompatibility=TRUST missing authorityScope:\n";
        missingTrust.forEach(t => output += `TRUST_MISSING: ${t.id}\n`);

        output += "\nTasks with trackCompatibility=PROBATE missing authorityScope:\n";
        missingProbate.forEach(t => output += `PROBATE_MISSING: ${t.id}\n`);

        fs.writeFileSync('tmp/audit_results.txt', output);
        console.log("Audit results written to tmp/audit_results.txt");
    });
});
