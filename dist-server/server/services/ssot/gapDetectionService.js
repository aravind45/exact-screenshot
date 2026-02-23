/**
 * SSOT Gap Detection Service - Finds missing items across the SSOT
 */
import { queryRows } from './dbClient.js';
const ALL_50_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
    'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
    'VA', 'WA', 'WV', 'WI', 'WY'
];
export async function runFullGapAnalysis() {
    const gaps = [];
    // 1. States missing jurisdictions
    const existingJurisdictions = await queryRows(`SELECT state_code FROM ssot_jurisdictions`);
    const existingCodes = new Set(existingJurisdictions.map((j) => j.state_code));
    for (const state of ALL_50_STATES) {
        if (!existingCodes.has(state)) {
            gaps.push({
                severity: 'CRITICAL', category: 'Missing Jurisdiction',
                message: `State ${state} has no jurisdiction record`,
                stateCode: state, fixAction: 'CREATE_JURISDICTION'
            });
        }
    }
    // 2. Jurisdictions without any roadmaps
    const statesWithoutRoadmaps = await queryRows(`
    SELECT j.id, j.state_code, j.state_name FROM ssot_jurisdictions j
    WHERE NOT EXISTS (SELECT 1 FROM ssot_probate_roadmaps r WHERE r.jurisdiction_id = j.id)
  `);
    for (const j of statesWithoutRoadmaps) {
        gaps.push({
            severity: 'CRITICAL', category: 'Missing Roadmap',
            message: `${j.state_name} (${j.state_code}) has no probate roadmaps`,
            entityType: 'jurisdiction', entityId: j.id, stateCode: j.state_code,
            fixAction: 'CREATE_ROADMAP'
        });
    }
    // 3. Roadmaps without phases
    const roadmapsWithoutPhases = await queryRows(`
    SELECT r.id, r.name, j.state_code FROM ssot_probate_roadmaps r
    JOIN ssot_jurisdictions j ON j.id = r.jurisdiction_id
    WHERE NOT EXISTS (SELECT 1 FROM ssot_roadmap_phases p WHERE p.roadmap_id = r.id)
  `);
    for (const r of roadmapsWithoutPhases) {
        gaps.push({
            severity: 'CRITICAL', category: 'Missing Phases',
            message: `Roadmap "${r.name}" (${r.state_code}) has no phases`,
            entityType: 'roadmap', entityId: r.id, stateCode: r.state_code,
            fixAction: 'CREATE_PHASE'
        });
    }
    // 4. Phases without steps
    const phasesWithoutSteps = await queryRows(`
    SELECT p.id, p.title, p.code, r.name as roadmap_name, j.state_code
    FROM ssot_roadmap_phases p
    JOIN ssot_probate_roadmaps r ON r.id = p.roadmap_id
    JOIN ssot_jurisdictions j ON j.id = r.jurisdiction_id
    WHERE NOT EXISTS (SELECT 1 FROM ssot_roadmap_steps s WHERE s.phase_id = p.id)
  `);
    for (const p of phasesWithoutSteps) {
        gaps.push({
            severity: 'WARNING', category: 'Missing Steps',
            message: `Phase "${p.title}" in ${p.roadmap_name} (${p.state_code}) has no steps`,
            entityType: 'phase', entityId: p.id, stateCode: p.state_code,
            fixAction: 'CREATE_STEP'
        });
    }
    // 5. Steps without actions
    const stepsWithoutActions = await queryRows(`
    SELECT s.id, s.title, s.code, p.title as phase_title, j.state_code
    FROM ssot_roadmap_steps s
    JOIN ssot_roadmap_phases p ON p.id = s.phase_id
    JOIN ssot_probate_roadmaps r ON r.id = p.roadmap_id
    JOIN ssot_jurisdictions j ON j.id = r.jurisdiction_id
    WHERE NOT EXISTS (SELECT 1 FROM ssot_step_actions a WHERE a.step_id = s.id)
  `);
    for (const s of stepsWithoutActions) {
        gaps.push({
            severity: 'WARNING', category: 'Missing Actions',
            message: `Step "${s.title}" in phase "${s.phase_title}" (${s.state_code}) has no actions`,
            entityType: 'step', entityId: s.id, stateCode: s.state_code,
            fixAction: 'CREATE_ACTION'
        });
    }
    // 6. Required steps missing forms
    const stepsWithoutForms = await queryRows(`
    SELECT s.id, s.title, s.code, s.is_optional, p.title as phase_title, j.state_code
    FROM ssot_roadmap_steps s
    JOIN ssot_roadmap_phases p ON p.id = s.phase_id
    JOIN ssot_probate_roadmaps r ON r.id = p.roadmap_id
    JOIN ssot_jurisdictions j ON j.id = r.jurisdiction_id
    WHERE s.is_optional = false
    AND NOT EXISTS (SELECT 1 FROM ssot_step_forms sf WHERE sf.step_id = s.id)
  `);
    for (const s of stepsWithoutForms) {
        gaps.push({
            severity: 'WARNING', category: 'Missing Forms',
            message: `Required step "${s.title}" (${s.state_code}) has no linked forms`,
            entityType: 'step', entityId: s.id, stateCode: s.state_code,
            fixAction: 'LINK_FORM'
        });
    }
    // 7. Orphaned forms (not linked to any step)
    const orphanedForms = await queryRows(`
    SELECT f.id, f.form_number, f.title FROM ssot_legal_forms f
    WHERE NOT EXISTS (SELECT 1 FROM ssot_step_forms sf WHERE sf.form_id = f.id)
  `);
    for (const f of orphanedForms) {
        gaps.push({
            severity: 'INFO', category: 'Orphaned Form',
            message: `Form "${f.form_number} - ${f.title}" is not linked to any step`,
            entityType: 'legal_form', entityId: f.id,
            fixAction: 'LINK_FORM'
        });
    }
    // 8. Unpublished draft content
    const draftRoadmaps = await queryRows(`
    SELECT r.id, r.name, j.state_code FROM ssot_probate_roadmaps r
    JOIN ssot_jurisdictions j ON j.id = r.jurisdiction_id
    WHERE r.status = 'DRAFT'
  `);
    for (const r of draftRoadmaps) {
        gaps.push({
            severity: 'INFO', category: 'Unpublished Draft',
            message: `Roadmap "${r.name}" (${r.state_code}) is still in DRAFT status`,
            entityType: 'roadmap', entityId: r.id, stateCode: r.state_code,
            fixAction: 'PUBLISH_ROADMAP'
        });
    }
    // 9. Missing statute citations on steps
    const stepsWithoutCitations = await queryRows(`
    SELECT s.id, s.title, s.code, j.state_code FROM ssot_roadmap_steps s
    JOIN ssot_roadmap_phases p ON p.id = s.phase_id
    JOIN ssot_probate_roadmaps r ON r.id = p.roadmap_id
    JOIN ssot_jurisdictions j ON j.id = r.jurisdiction_id
    WHERE s.source_citation IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM ssot_statute_references sr
      WHERE sr.entity_type = 'step' AND sr.entity_id = s.id
    )
  `);
    for (const s of stepsWithoutCitations) {
        gaps.push({
            severity: 'INFO', category: 'Missing Citation',
            message: `Step "${s.title}" (${s.state_code}) has no statute citation`,
            entityType: 'step', entityId: s.id, stateCode: s.state_code,
            fixAction: 'ADD_CITATION'
        });
    }
    const critical = gaps.filter(g => g.severity === 'CRITICAL').length;
    const warning = gaps.filter(g => g.severity === 'WARNING').length;
    const info = gaps.filter(g => g.severity === 'INFO').length;
    return {
        summary: { total: gaps.length, critical, warning, info },
        gaps
    };
}
export async function getStateCompleteness() {
    const jurisdictions = await queryRows(`
    SELECT j.id, j.state_code, j.state_name, j.status,
      (SELECT COUNT(*) FROM ssot_probate_roadmaps r WHERE r.jurisdiction_id = j.id) as roadmap_count,
      (SELECT COUNT(*) FROM ssot_probate_roadmaps r WHERE r.jurisdiction_id = j.id AND r.status = 'PUBLISHED') as published_roadmap_count,
      (SELECT COUNT(*) FROM ssot_legal_forms f WHERE f.jurisdiction_id = j.id) as form_count,
      (SELECT COUNT(*) FROM ssot_accounting_rules ar WHERE ar.jurisdiction_id = j.id) as accounting_rule_count,
      (SELECT COUNT(*) FROM ssot_tax_obligations t WHERE t.jurisdiction_id = j.id) as tax_obligation_count,
      (SELECT COUNT(*) FROM ssot_distribution_rules d WHERE d.jurisdiction_id = j.id) as distribution_rule_count
    FROM ssot_jurisdictions j
    ORDER BY j.state_name
  `);
    const missingStates = ALL_50_STATES.filter(sc => !jurisdictions.find((j) => j.state_code === sc));
    return {
        configured: jurisdictions,
        missing: missingStates,
        totalStates: 50,
        configuredCount: jurisdictions.length,
        completionPct: Math.round((jurisdictions.length / 50) * 100)
    };
}
export async function getSSOTStats() {
    const [jurisdictions] = await queryRows(`SELECT COUNT(*) as count FROM ssot_jurisdictions`);
    const [roadmaps] = await queryRows(`SELECT COUNT(*) as count FROM ssot_probate_roadmaps`);
    const [phases] = await queryRows(`SELECT COUNT(*) as count FROM ssot_roadmap_phases`);
    const [steps] = await queryRows(`SELECT COUNT(*) as count FROM ssot_roadmap_steps`);
    const [actions] = await queryRows(`SELECT COUNT(*) as count FROM ssot_step_actions`);
    const [forms] = await queryRows(`SELECT COUNT(*) as count FROM ssot_legal_forms`);
    const [probateTypes] = await queryRows(`SELECT COUNT(*) as count FROM ssot_probate_types`);
    const [assetTypes] = await queryRows(`SELECT COUNT(*) as count FROM ssot_asset_types`);
    const [liabilityTypes] = await queryRows(`SELECT COUNT(*) as count FROM ssot_liability_types`);
    const [accountingRules] = await queryRows(`SELECT COUNT(*) as count FROM ssot_accounting_rules`);
    const [taxObligations] = await queryRows(`SELECT COUNT(*) as count FROM ssot_tax_obligations`);
    const [publishedRoadmaps] = await queryRows(`SELECT COUNT(*) as count FROM ssot_probate_roadmaps WHERE status='PUBLISHED'`);
    return {
        jurisdictions: Number(jurisdictions?.count || 0),
        roadmaps: Number(roadmaps?.count || 0),
        publishedRoadmaps: Number(publishedRoadmaps?.count || 0),
        phases: Number(phases?.count || 0),
        steps: Number(steps?.count || 0),
        actions: Number(actions?.count || 0),
        forms: Number(forms?.count || 0),
        probateTypes: Number(probateTypes?.count || 0),
        assetTypes: Number(assetTypes?.count || 0),
        liabilityTypes: Number(liabilityTypes?.count || 0),
        accountingRules: Number(accountingRules?.count || 0),
        taxObligations: Number(taxObligations?.count || 0),
    };
}
