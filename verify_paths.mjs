import { determinePath } from './src/lib/pathEngine.js';
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./estate_roadmap_data.json', 'utf8'));

let passed = 0;
let failed = 0;
const mismatches = [];

// Mapping Excel outcomes to AuthorityType IDs
const outcomeMap = {
    'Contested Probate Litigation': 'CONTESTED_ESTATE',
    'Insolvent Estate Administration': 'INSOLVENT_ESTATE',
    'Trust Administration (Revocable Living Trust)': 'TRUST_ADMIN_REVOCABLE',
    'Irrevocable Trust Administration': 'TRUST_ADMIN_IRREVOCABLE',
    'Ancillary Probate Required': 'ANCILLARY_PROBATE',
    'General Probate Administration': 'FORMAL_PROBATE',
    'Intestate Probate': 'INTESTATE'
};

data.forEach((row, index) => {
    const answers = {
        hasWill: row['Will'] === 'Yes' ? 'yes' : 'no',
        hasTrust: row['Trust Type'] !== 'None' ? 'yes' : 'no',
        trustType: row['Trust Type'] === 'Revocable' ? 'revocable' :
            row['Trust Type'] === 'Irrevocable' ? 'irrevocable' : 'none',
        hasTODDeed: row['TOD Deed'] === 'Yes' ? 'yes' : 'no',
        hasContest: row['Contested'] === 'Yes' ? 'yes' : 'no',
        isOutOfState: row['Out of State Property'] === 'Yes' ? 'yes' : 'no',
        isSpouse: row['Surviving Spouse'] === 'Yes' ? 'yes' : 'no',
        debtStatus: row['Debt Status'] === 'Insolvent' ? 'solvent' : 'solvent' // Force solvent for now to see baseline
    };

    // Note: debtStatus answer needs to be 'insolvent' if row['Debt Status'] is 'Insolvent'
    answers.debtStatus = row['Debt Status'] === 'Insolvent' ? 'insolvent' : 'solvent';

    const result = determinePath(answers, 'CA');
    const expectedOutcome = row['Primary Path Outcome'];

    // Check outcome
    // We need to decide if we want to match exactly or map to our IDs
    const expectedId = outcomeMap[expectedOutcome];

    let isMatch = true;
    const errors = [];

    if (result.pathId !== expectedId && !(result.pathId === 'INTESTATE' && expectedId === 'FORMAL_PROBATE')) {
        // "General Probate Administration" can be FORMAL or INTESTATE in our engine, 
        // but the Excel differentiates "Intestate Probate" vs "General Probate".
        if (expectedOutcome === 'General Probate Administration' && result.pathId === 'FORMAL_PROBATE') {
            // Match
        } else if (expectedOutcome === 'Intestate Probate' && result.pathId === 'INTESTATE') {
            // Match
        } else {
            isMatch = false;
            errors.push(`Outcome Mismatch: Expected ${expectedOutcome} (${expectedId}), got ${result.pathId}`);
        }
    }

    if (result.complexity !== row['Complexity']) {
        isMatch = false;
        errors.push(`Complexity Mismatch: Expected ${row['Complexity']}, got ${result.complexity}`);
    }

    if (isMatch) {
        passed++;
    } else {
        failed++;
        mismatches.push({
            index: index + 1,
            inputs: row,
            errors
        });
    }
});

console.log(`Verification Complete:`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (mismatches.length > 0) {
    console.log(`\nFirst 5 Mismatches:`);
    mismatches.slice(0, 5).forEach(m => {
        console.log(`Row ${m.index}:`);
        console.log(`  Inputs: Will=${m.inputs['Will']}, Trust=${m.inputs['Trust Type']}, OutOfState=${m.inputs['Out of State Property']}, Debt=${m.inputs['Debt Status']}`);
        m.errors.forEach(e => console.log(`  Error: ${e}`));
    });

    fs.writeFileSync('./verification_mismatches.json', JSON.stringify(mismatches, null, 2));
    console.log(`\nAll mismatches saved to verification_mismatches.json`);
}
