import { SETTLEMENT_PHASE_TASKS, TRUST_PHASE_TASKS, MODIFIER_PHASE_TASKS, PROBATE_ESCALATION_PHASE } from './src/config/settlementPhases';

const allTasks = [
    ...SETTLEMENT_PHASE_TASKS.flatMap(p => p.tasks),
    ...TRUST_PHASE_TASKS.flatMap(p => p.tasks),
    ...MODIFIER_PHASE_TASKS.flatMap(p => p.tasks),
    ...PROBATE_ESCALATION_PHASE.tasks
];

const missing = allTasks.filter(t => !t.authorityScope);
console.log(`Found ${missing.length} tasks without authorityScope`);
for (const t of missing) {
    console.log(`- ${t.id} (trackCompatibility: ${t.trackCompatibility?.join(', ') || 'none'})`);
}
