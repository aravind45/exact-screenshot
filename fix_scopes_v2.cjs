/**
 * Scope Migration Script v2 — Strict Scoping
 *
 * This script:
 * 1. Finds all tasks with `applicability: { states: ["XX"] }` (single-state)
 *    and sets their scope to `US-XX`
 * 2. Finds tasks with state-coded IDs (e.g., _tx_, _nj_) and sets their scope
 * 3. Leaves truly universal tasks as CORE
 *
 * Run: node fix_scopes_v2.cjs
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/config/settlementPhases.ts');
let content = fs.readFileSync(filePath, 'utf8');

// ── Step 1: Explicit state-specific task ID → scope mapping ─────────────
// These are tasks that MUST be scoped to a specific state based on their ID
// and content. This is the source of truth.
const EXPLICIT_SCOPE_MAP = {
    // ── CA-only tasks ────────────────────────────────────────────────────
    "prepare_notice_proposed_action": "US-CA",
    "wait_proposed_action_period": "US-CA",
    "petition_confirm_sale": "US-CA",
    "obtain_sale_confirmation_order": "US-CA",
    "ca_calculate_overbid_requirements": "US-CA",
    "ca_notice_of_hearing": "US-CA",
    "ca_attend_confirmation_hearing": "US-CA",
    "file_spousal_petition": "US-CA",
    "give_spousal_notice": "US-CA",
    "obtain_spousal_order": "US-CA",
    "file_succession_petition": "US-CA",
    "give_succession_notice": "US-CA",
    "obtain_succession_order": "US-CA",

    // ── GA-only tasks ────────────────────────────────────────────────────
    "ga_years_support_petition": "US-GA",
    "ga_years_support_citation": "US-GA",
    "ga_years_support_order": "US-GA",
    "file_ga_no_admin": "US-GA",

    // ── OH-only tasks ────────────────────────────────────────────────────
    "oh_family_allowance": "US-OH",
    "oh_certificate_of_transfer": "US-OH",

    // ── TX-only tasks ────────────────────────────────────────────────────
    "file_tx_independent_admin": "US-TX",
    "file_tx_muniment_of_title": "US-TX",
    "tx_muniment_compliance_check": "US-TX",
    "file_tx_dependent_admin": "US-TX",
    "tx_admin_type_branching": "US-TX",
    "tx_ten_day_posting": "US-TX",
    "file_tx_heirship_proceeding": "US-TX",
    "tx_homestead_protection": "US-TX",
    "tx_exempt_property": "US-TX",
    "tx_small_estate_affidavit": "US-TX",
    "tx_bond_determination": "US-TX",
    "tx_citation_issuance": "US-TX",
    "tx_community_property_partition": "US-TX",
    "tx_final_account_filing": "US-TX",
    "tx_statutory_durable_poa": "US-TX",
    "tx_notice_of_closing_estate": "US-TX",

    // ── NJ-only tasks ────────────────────────────────────────────────────
    "nj_elective_share_claim": "US-NJ",
    "nj_real_property_transfer": "US-NJ",
    "nj_surrogate_fee_schedule": "US-NJ",
    "nj_tax_waiver": "US-NJ",
    "nj_refunding_bond": "US-NJ",
    "nj_informal_accounting": "US-NJ",
    "file_nj_complaint_probate": "US-NJ",
    "nj_inheritance_tax": "US-NJ",
    "nj_estate_tax_return": "US-NJ",
    "nj_prepay_inheritance_tax": "US-NJ",
    "nj_self_executing_waiver": "US-NJ",
    "nj_close_estate": "US-NJ",
    "nj_notice_to_creditors": "US-NJ",
    "nj_creditor_claim_window": "US-NJ",
    "nj_first_accounting_deadline": "US-NJ",
    "nj_surrogate_filing": "US-NJ",
    "nj_renunciation_filing": "US-NJ",
    "nj_caveat_filing": "US-NJ",
    "nj_order_to_show_cause": "US-NJ",
    "nj_order_to_limit_creditors": "US-NJ",

    // ── NY-only tasks ────────────────────────────────────────────────────
    "file_ny_surrogate_probate": "US-NY",
    "file_ny_ancillary_probate": "US-NY",

    // ── FL-only tasks ────────────────────────────────────────────────────
    "file_fl_disposition_without_admin": "US-FL",
    "file_fl_summary_admin": "US-FL",

    // ── MA-only tasks ────────────────────────────────────────────────────
    "file_ma_voluntary_admin": "US-MA",
    "ma_mupc_informal_probate": "US-MA",
};

// ── Step 2: Auto-detect from applicability.states patterns ──────────────
// Regex: find `id: "xxx",\n        scope: "CORE",` where there's an
// `applicability: { states: ["XX"] }` nearby
const taskBlockRegex = /\{\s*\n\s*id:\s*"([^"]+)",\s*\n\s*scope:\s*"([^"]+)",/g;
let match;
const taskScopes = {};

while ((match = taskBlockRegex.exec(content)) !== null) {
    const taskId = match[1];
    const currentScope = match[2];
    taskScopes[taskId] = currentScope;
}

console.log(`Found ${Object.keys(taskScopes).length} tasks with scope fields`);

// ── Step 3: Apply explicit scope map ────────────────────────────────────
let changes = 0;

for (const [taskId, newScope] of Object.entries(EXPLICIT_SCOPE_MAP)) {
    // Match the specific task's scope line
    const pattern = new RegExp(
        `(id:\\s*"${taskId}",\\s*\\n\\s*scope:\\s*)"[^"]*"`,
        'g'
    );

    const beforeLen = content.length;
    content = content.replace(pattern, `$1"${newScope}"`);
    if (content.length !== beforeLen || content.includes(`id: "${taskId}",\n        scope: "${newScope}"`)) {
        // Check if the replacement actually happened by looking for the new value
        if (content.includes(`id: "${taskId}"`) && content.includes(`scope: "${newScope}"`)) {
            changes++;
        }
    }
}

// ── Step 4: Auto-detect remaining tasks with applicability.states ───────
// For tasks not in the explicit map but having applicability.states with a
// single state, infer the scope
const singleStateRegex = /id:\s*"([^"]+)",\s*\n\s*scope:\s*"CORE",[^}]*?applicability:\s*\{\s*states:\s*\[\s*"([A-Z]{2})"\s*\]/gs;
let autoMatch;
const autoDetected = {};

// Reset and scan
let contentCopy = content;
while ((autoMatch = singleStateRegex.exec(contentCopy)) !== null) {
    const taskId = autoMatch[1];
    const stateCode = autoMatch[2];
    if (!EXPLICIT_SCOPE_MAP[taskId]) {
        autoDetected[taskId] = `US-${stateCode}`;
    }
}

console.log(`Auto-detected ${Object.keys(autoDetected).length} additional state-specific tasks:`);
for (const [id, scope] of Object.entries(autoDetected)) {
    console.log(`  ${id} → ${scope}`);

    const pattern = new RegExp(
        `(id:\\s*"${id}",\\s*\\n\\s*scope:\\s*)"CORE"`,
        'g'
    );
    content = content.replace(pattern, `$1"${scope}"`);
    changes++;
}

// ── Step 5: Report ──────────────────────────────────────────────────────
fs.writeFileSync(filePath, content);

// Count final scope distribution
const coreCount = (content.match(/scope:\s*"CORE"/g) || []).length;
const stateScopes = {};
const stateScopeRegex = /scope:\s*"US-([A-Z]{2})"/g;
let sm;
while ((sm = stateScopeRegex.exec(content)) !== null) {
    stateScopes[sm[1]] = (stateScopes[sm[1]] || 0) + 1;
}

console.log(`\n--- Scope Distribution ---`);
console.log(`CORE: ${coreCount}`);
for (const [state, count] of Object.entries(stateScopes).sort((a, b) => b[1] - a[1])) {
    console.log(`US-${state}: ${count}`);
}
console.log(`Total changes: ${changes}`);
