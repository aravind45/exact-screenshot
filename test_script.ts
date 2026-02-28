import { SETTLEMENT_PHASE_TASKS, TRUST_PHASE_TASKS, MODIFIER_PHASE_TASKS, PROBATE_ESCALATION_PHASE } from "./src/config/settlementPhases";
SETTLEMENT_PHASE_TASKS.forEach((p, i) => {
    if (!p || typeof p.tasks === 'undefined') {
        console.log("SETTLEMENT_PHASE_TASKS undefined element at index", i, p?.phase);
    }
});
TRUST_PHASE_TASKS.forEach((p, i) => {
    if (!p || typeof p.tasks === 'undefined') {
        console.log("TRUST_PHASE_TASKS undefined element at index", i, p?.phase);
    }
});
MODIFIER_PHASE_TASKS.forEach((p, i) => {
    if (!p || typeof p.tasks === 'undefined') {
        console.log("MODIFIER_PHASE_TASKS undefined element at index", i, p?.phase);
    }
});
console.log("Validation complete.");
