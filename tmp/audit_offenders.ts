import {
    SETTLEMENT_PHASE_TASKS,
    TRUST_PHASE_TASKS,
    MODIFIER_PHASE_TASKS,
    PROBATE_ESCALATION_PHASE
} from '../src/config/settlementPhases.js';

const offenders = [
    'send_statutory_notice',
    'distribute_assets_to_beneficiaries',
    'obtain_beneficiary_receipts',
    'notify_state_agencies_health',
    'file_probate_petition',
    'file_administration_petition',
    'attend_probate_hearing',
    'attend_administration_hearing',
    'receive_letters_testamentary',
    'receive_letters_administration',
    'publish_notice',
    'file_inventory',
    'prepare_notice_proposed_action',
    'petition_confirm_sale',
    'obtain_ein_probate',
    'obtain_ein_trust',
    'pay_taxes',
    'file_form_1041',
    'obtain_tax_clearance',
    'debt_priority_risk'
];

const allPhases = [
    ...SETTLEMENT_PHASE_TASKS,
    ...TRUST_PHASE_TASKS,
    ...MODIFIER_PHASE_TASKS,
    PROBATE_ESCALATION_PHASE
].filter(Boolean);

const results = [];

for (const id of offenders) {
    const tasks = [];
    for (const phase of allPhases) {
        for (const task of phase.tasks) {
            if (task.id === id) {
                tasks.push({
                    phase: phase.phase,
                    authorityScope: task.authorityScope || 'MISSING'
                });
            }
        }
    }
    results.push({ id, instances: tasks });
}

console.log(JSON.stringify(results, null, 2));
