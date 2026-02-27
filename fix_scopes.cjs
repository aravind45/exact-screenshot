const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/config/settlementPhases.ts');
const content = fs.readFileSync(filePath, 'utf8');

const SCOPE_MAP = {
    // CA
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
    // GA
    "ga_years_support_petition": "US-GA",
    "ga_years_support_citation": "US-GA",
    "ga_years_support_order": "US-GA",
    "file_ga_no_admin": "US-GA",
    // OH
    "oh_family_allowance": "US-OH",
    "oh_certificate_of_transfer": "US-OH",
    // TX
    "file_tx_independent_admin": "US-TX",
    "file_tx_muniment_of_title": "US-TX",
    "tx_muniment_compliance_check": "US-TX"
};

let newContent = content;

// First pass: ensure all tasks have a scope (default CORE)
newContent = newContent.replace(/(\s+id: "([^"]+)",)(?!\s*scope:)/g, (match, p1, p2) => {
    const scope = SCOPE_MAP[p2] || "CORE";
    return `${p1}\n        scope: "${scope}",`;
});

// Second pass: update existing scopes if they are in SCOPE_MAP and currently "CORE"
newContent = newContent.replace(/(\s+id: "([^"]+)",)\s+scope: "CORE",/g, (match, p1, p2) => {
    if (SCOPE_MAP[p2]) {
        return `${p1}\n        scope: "${SCOPE_MAP[p2]}",`;
    }
    return match;
});

fs.writeFileSync(filePath, newContent);
console.log('Done');
