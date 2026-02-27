#!/usr/bin/env python3
"""
Script to add authorityScope fields to tasks in settlementPhases.ts
"""
import re
import sys

# Read the file
with open('/home/engine/project/src/config/settlementPhases.ts', 'r') as f:
    content = f.read()

# Step 1: Add authorityScope field to PhaseTask interface
old_interface = "  trackCompatibility?: (\"PROBATE\" | \"TRUST\" | \"AFFIDAVIT\" | \"NON_PROBATE\")[];"
new_interface = '  trackCompatibility?: ("PROBATE" | "TRUST" | "AFFIDAVIT" | "NON_PROBATE")[];\n  authorityScope?: "PROBATE" | "TRUST" | "BOTH";'
content = content.replace(old_interface, new_interface, 1)

# ─── PROBATE-ONLY TASKS ───────────────────────────────────────────────────────
# These tasks appear ONLY in a probate context

PROBATE_TASK_IDS = [
    "file_probate_petition",
    "file_administration_petition",
    "pay_filing_fee",
    "submit_oath_designation",
    "obtain_citation",
    "serve_citation",
    "attend_probate_hearing",
    "attend_administration_hearing",
    "receive_letters_testamentary",
    "receive_letters_administration",
    "handle_bond_waivers",
    "request_bond_waiver",
    "obtain_bond_waiver_order",
    "file_bond_waiver",
    "obtain_letters_testamentary",
    "publish_notice",
    "mail_notice",
    "mail_creditor_notices",
    "send_creditor_notices",
    "file_inventory",
    "file_inventory_appraisal",
    "prepare_notice_proposed_action",
    "wait_proposed_action_period",
    "petition_confirm_sale",
    "obtain_sale_confirmation_order",
    "prepare_accounting",
    "file_final_petition",
    "attend_final_hearing",
    "file_final_accounting",
    "close_estate",
    # Probate escalation
    "escalation_evaluate_path",
    "escalation_file_petition",
    "escalation_obtain_letters",
    "escalation_transfer_to_trust",
    # Modifier phases (probate specific)
    "identify_out_of_state_assets",
    "confirm_ancillary_requirements",
    "ancillary_filing",
    "preserve_litigation_evidence",
    "engage_litigation_counsel",
    "mediation_strategy",
    "freeze_distributions_litigation",
    "stop_insolvent_distributions",
    "prioritize_claims_statutory",
    "negotiate_insolvency_settlements",
    "close_insolvent_accounting",
]

# ─── TRUST-ONLY TASKS ─────────────────────────────────────────────────────────
TRUST_TASK_IDS = [
    "locate_trust",
    "identify_successor_trustee",
    "sign_trustee_acceptance",
    "prepare_certification_of_trust",
    "obtain_ein_trust",
    "file_irs_form_56",
    "secure_trust_property",
    "identify_all_beneficiaries",
    "send_statutory_notice",
    "notify_state_agencies_health",
    "handle_trust_copy_requests",
    "identify_minor_trust_beneficiaries",
    "wait_contest_period",
    "inventory_trust_assets",
    "verify_trust_titling",
    "obtain_dod_valuations",
    "check_out_of_trust_assets",
    "probate_escalation_check",
    "notify_financial_institutions",
    "trust_creditor_assessment",
    "pay_funeral_last_illness",
    "pay_ongoing_expenses",
    "evaluate_trust_solvency",
    "pay_trust_debts",
    "file_final_1040",
    "determine_trust_tax_posture",
    "obtain_tax_clearance",
    "prepare_trust_accounting",
    "prepare_distribution_schedule",
    "reserve_policy",
    "distribute_assets_to_beneficiaries",
    "obtain_beneficiary_receipts",
    "send_final_accounting",
    "close_trust_accounts",
    "complete_trust_administration",
]

# ─── BOTH TASKS (shared between probate and trust) ────────────────────────────
BOTH_TASK_IDS = [
    "preliminary_asset_scan",
    "secure_property",
    "secure_property_2",
    "open_estate_account",
    "obtain_ein_probate",
    "file_irs_form_56_probate",
    "complete_inventory",
    "debt_priority_risk",
    "pay_approved",
    "evaluate_and_document_claims",
    "review_claims",
    "reject_invalid",
    "file_form_1041",
    "issue_k1",
    "pay_taxes",
    "distribute_assets",
    "evaluate_form_706",
]

# Build a map of task id -> authority scope
scope_map = {}
for task_id in PROBATE_TASK_IDS:
    scope_map[task_id] = "PROBATE"
for task_id in TRUST_TASK_IDS:
    scope_map[task_id] = "TRUST"
for task_id in BOTH_TASK_IDS:
    scope_map[task_id] = "BOTH"

# Step 2: For each task that needs an authorityScope, insert it after the id line
# Pattern: find `id: "TASK_ID",` and insert authorityScope on the next line (or as part of the scope line)
# We need to add authorityScope right after the `scope:` line of each task

def add_authority_scope(content, task_id, authority_scope):
    """Add authorityScope to a task after the scope: line"""
    # Pattern: id: "TASK_ID", followed eventually by scope: "..."
    # We look for the task block and add authorityScope after scope:
    
    # First, find the task
    id_pattern = rf'(\s+id:\s*"{re.escape(task_id)}",)'
    
    # Check if already has authorityScope
    # Find the task block
    id_match = list(re.finditer(id_pattern, content))
    if not id_match:
        return content, False
    
    added = 0
    for match in id_match:
        pos = match.end()
        # Find the scope: line after this id
        # Look for next scope: "CORE" or scope: "US-..." within the next 500 chars
        block_end = min(pos + 600, len(content))
        block = content[pos:block_end]
        
        # Check if authorityScope already exists in this block (before next id:)
        next_id = block.find('\n        id:')
        if next_id == -1:
            next_id = block.find('\n      id:')
        check_block = block[:next_id] if next_id != -1 else block
        if 'authorityScope:' in check_block:
            continue
        
        # Find scope: line
        scope_match = re.search(r'(\n(\s+)scope:\s*"[^"]+",)', block)
        if scope_match:
            indent = scope_match.group(2)
            insert_at = pos + scope_match.end()
            insert_text = f'\n{indent}authorityScope: "{authority_scope}",'
            content = content[:insert_at] + insert_text + content[insert_at:]
            added += 1
    
    return content, added > 0

# Apply all scope assignments
changes = 0
for task_id, authority_scope in scope_map.items():
    content, changed = add_authority_scope(content, task_id, authority_scope)
    if changed:
        changes += 1
    # else:
    #     print(f"  WARNING: could not find/tag task: {task_id}", file=sys.stderr)

print(f"Tagged {changes} tasks with authorityScope", file=sys.stderr)

# Write back
with open('/home/engine/project/src/config/settlementPhases.ts', 'w') as f:
    f.write(content)

print("Done!", file=sys.stderr)
