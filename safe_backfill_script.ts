import * as fs from 'fs';

const PROBATE_KEYWORDS = ['petition', 'hearing', 'guardian', 'escalate_to_probate_trigger', 'spousal', 'succession', 'notice', 'bond', 'objection', 'contest', 'waiver_order', 'wait_claim_period', 'letters', 'proposed_action', 'sale_confirmation', 'court', 'ancillary_filing', 'irs_form_56'];

function getScope(id: string): string {
    if (id === 'secure_trust_property' || id === 'handle_trust_copy_requests' || id === 'identify_minor_trust_beneficiaries' || id === 'check_out_of_trust_assets' || id === 'probate_escalation_check' || id === 'evaluate_trust_solvency' || id === 'pay_trust_debts' || id === 'determine_trust_tax_posture' || id === 'close_trust_accounts' || id === 'file_irs_form_56') return 'TRUST';
    if (PROBATE_KEYWORDS.some(k => id.includes(k))) return 'PROBATE';
    if (["issue_cert_trust", "check_tod_recordation", "check_tod_revocation", "check_beneficiary_survival", "check_joint_tenancy_override", "prepare_beneficiary_authority_packet", "escalate_to_probate_trigger", "notify_ssa", "record_affidavit_of_death", "notify_recorder_assessor", "check_unclaimed_property", "business_valuation", "freeze_accounts", "get_dod_values", "hire_appraiser", "complete_inventory", "tax_withholding_review", "evaluate_solvency", "tod_creditor_review", "transfer_accounts", "sell_property", "issue_k1", "prepare_accounting", "distribute_assets", "international_distribution_prep", "obtain_dod_valuations", "notify_financial_institutions", "pay_funeral_last_illness", "pay_ongoing_expenses", "file_final_1040", "evaluate_form_706", "prepare_distribution_schedule", "reserve_policy", "send_final_accounting", "identify_out_of_state_assets", "confirm_ancillary_requirements", "preserve_litigation_evidence", "engage_litigation_counsel", "mediation_strategy", "freeze_distributions_litigation", "stop_insolvent_distributions", "prioritize_claims_statutory", "negotiate_insolvency_settlements", "close_insolvent_accounting", "manage_business_authority"].includes(id)) return 'BOTH';
    return 'PROBATE';
}

const file = 'src/config/settlementPhases.ts';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const missingIds = [
    "check_tod_recordation", "check_tod_revocation", "check_beneficiary_survival", "check_joint_tenancy_override", "prepare_beneficiary_authority_packet", "escalate_to_probate_trigger", "notify_ssa", "record_affidavit_of_death", "notify_recorder_assessor", "prepare_required_notices_and_waivers", "request_temporary_authority", "calculate_filing_fees", "compile_required_form_pack", "petition_guardian_ad_litem", "obtain_guardian_order", "give_spousal_notice", "obtain_spousal_order", "issue_cert_trust", "manage_business_authority", "file_succession_petition", "give_succession_notice", "obtain_succession_order", "track_special_notice_requests", "serve_special_notice_parties", "handle_bond_waivers", "obtain_bond_waiver_order", "respond_to_objections", "attend_contest_hearing", "resolve_contest", "check_unclaimed_property", "business_valuation", "freeze_accounts", "get_dod_values", "hire_appraiser", "complete_inventory", "tax_withholding_review", "coordinate_with_guardian", "evaluate_solvency", "wait_claim_period", "monitor_creditor_claim_period", "tod_creditor_review", "minor_beneficiary_court_approval", "present_letters", "transfer_accounts", "wait_proposed_action_period", "obtain_sale_confirmation_order", "sell_property", "issue_k1", "prepare_accounting", "guardian_distribution_approval", "blocked_account_minors", "file_final_petition", "attend_final_hearing", "distribute_assets", "file_final_accounting", "international_distribution_prep", "file_irs_form_56", "secure_trust_property", "handle_trust_copy_requests", "identify_minor_trust_beneficiaries", "obtain_dod_valuations", "check_out_of_trust_assets", "probate_escalation_check", "notify_financial_institutions", "pay_funeral_last_illness", "pay_ongoing_expenses", "evaluate_trust_solvency", "pay_trust_debts", "file_final_1040", "determine_trust_tax_posture", "evaluate_form_706", "prepare_distribution_schedule", "reserve_policy", "send_final_accounting", "close_trust_accounts", "identify_out_of_state_assets", "confirm_ancillary_requirements", "ancillary_filing", "preserve_litigation_evidence", "engage_litigation_counsel", "mediation_strategy", "freeze_distributions_litigation", "stop_insolvent_distributions", "prioritize_claims_statutory", "negotiate_insolvency_settlements", "close_insolvent_accounting"
];

let insertedCount = 0;
for (let i = 0; i < lines.length; i++) {
    for (const id of missingIds) {
        if (lines[i].includes(`id: "${id}",`) && !lines[i].trim().startsWith('//')) {
            const scope = getScope(id);
            // Insert authorityScope on the next line
            // copy the whitespace prefix from the id line
            const match = lines[i].match(/^(\s*)/);
            const prefix = match ? match[1] : '      ';
            lines.splice(i + 1, 0, `${prefix}authorityScope: "${scope}",`);
            i++; // skip the line we just added
            insertedCount++;
            break;
        }
    }
}

fs.writeFileSync('src/config/settlementPhases.ts', lines.join('\n'));
console.log(`Successfully updated settlementPhases.ts using line splice safe approach. Inserted ${insertedCount} properties.`);
