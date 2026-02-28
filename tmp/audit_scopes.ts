import {
    SETTLEMENT_PHASE_TASKS,
    TRUST_PHASE_TASKS,
    MODIFIER_PHASE_TASKS,
    PROBATE_ESCALATION_PHASE
} from '../src/config/settlementPhases.ts';

const tasksMissingScope = [];

const allPhaseLists = [
    ...SETTLEMENT_PHASE_TASKS,
    ...TRUST_PHASE_TASKS,
    ...MODIFIER_PHASE_TASKS,
    PROBATE_ESCALATION_PHASE
].filter(Boolean);

const allTasksData = [];
for (const phase of allPhaseLists) {
    for (const task of phase.tasks) {
        allTasksData.push({
            id: task.id,
            phase: phase.phase,
            authorityScope: task.authorityScope || 'UNDEFINED',
            trackCompatibility: task.trackCompatibility || 'NONE'
        });
    }
}

console.log(JSON.stringify(allTasksData, null, 2));
console.log(`Total tasks: ${allTasksData.length}`);
