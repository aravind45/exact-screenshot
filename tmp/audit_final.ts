import {
    SETTLEMENT_PHASE_TASKS,
    TRUST_PHASE_TASKS,
    MODIFIER_PHASE_TASKS,
    PROBATE_ESCALATION_PHASE,
    PhaseTask,
    PhaseTaskList
} from './src/config/settlementPhases';

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

const tasks = allTasks();

const missingTrust = tasks.filter(t =>
    t.trackCompatibility?.includes("TRUST") && t.authorityScope === undefined
);

const missingProbate = tasks.filter(t =>
    t.trackCompatibility?.includes("PROBATE") && t.authorityScope === undefined
);

console.log("Tasks with trackCompatibility=TRUST missing authorityScope:");
console.log(missingTrust.map(t => t.id));

console.log("\nTasks with trackCompatibility=PROBATE missing authorityScope:");
console.log(missingProbate.map(t => t.id));
