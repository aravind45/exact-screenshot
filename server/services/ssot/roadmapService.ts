/**
 * SSOT Roadmap Service - CRUD for roadmaps, phases, steps, actions, dependencies
 */
import { queryRows, executeSQL, logChange } from './dbClient.js';

// ─── Roadmaps ───
export async function listRoadmaps(jurisdictionId?: string) {
  const where = jurisdictionId ? `WHERE r.jurisdiction_id = $1` : '';
  const params = jurisdictionId ? [jurisdictionId] : [];
  return queryRows(`
    SELECT r.*, j.state_code, j.state_name, pt.code as probate_type_code, pt.name as probate_type_name,
      (SELECT COUNT(*) FROM ssot_roadmap_phases p WHERE p.roadmap_id = r.id) as phase_count
    FROM ssot_probate_roadmaps r
    JOIN ssot_jurisdictions j ON j.id = r.jurisdiction_id
    JOIN ssot_probate_types pt ON pt.id = r.probate_type_id
    ${where}
    ORDER BY j.state_name, pt.name
  `, ...params);
}

export async function getRoadmap(id: string) {
  const rows = await queryRows(`
    SELECT r.*, j.state_code, j.state_name, pt.code as probate_type_code, pt.name as probate_type_name
    FROM ssot_probate_roadmaps r
    JOIN ssot_jurisdictions j ON j.id = r.jurisdiction_id
    JOIN ssot_probate_types pt ON pt.id = r.probate_type_id
    WHERE r.id = $1
  `, id);
  return rows[0] || null;
}

export async function getRoadmapFull(id: string) {
  const roadmap = await getRoadmap(id);
  if (!roadmap) return null;
  const phases = await listPhases(id);
  for (const phase of phases) {
    phase.steps = await listSteps(phase.id);
    for (const step of phase.steps) {
      step.actions = await listStepActions(step.id);
      step.forms = await listStepForms(step.id);
      step.dependencies = await listStepDependencies(step.id);
    }
  }
  roadmap.phases = phases;
  return roadmap;
}

export async function upsertRoadmap(data: any, userId?: string) {
  if (data.id) {
    await executeSQL(`
      UPDATE ssot_probate_roadmaps SET
        jurisdiction_id=$2, probate_type_id=$3, name=$4, description=$5,
        estimated_duration_months=$6, court_type_id=$7, filing_authority=$8,
        is_default=$9, source_citation=$10, version=version+1, updated_at=NOW(), updated_by=$11
      WHERE id=$1
    `, data.id, data.jurisdictionId, data.probateTypeId, data.name, data.description||null,
      data.estimatedDurationMonths||null, data.courtTypeId||null, data.filingAuthority||null,
      data.isDefault||false, data.sourceCitation||null, userId||null);
    await logChange({ entityType: 'roadmap', entityId: data.id, action: 'UPDATE', newValue: data, changedBy: userId });
    return { id: data.id, ...data };
  }
  const rows = await queryRows(`
    INSERT INTO ssot_probate_roadmaps (id, jurisdiction_id, probate_type_id, name, description,
      estimated_duration_months, court_type_id, filing_authority, is_default, source_citation,
      created_by, updated_by)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING *
  `, data.jurisdictionId, data.probateTypeId, data.name, data.description||null,
    data.estimatedDurationMonths||null, data.courtTypeId||null, data.filingAuthority||null,
    data.isDefault||false, data.sourceCitation||null, userId||null);
  const c = rows[0];
  await logChange({ entityType: 'roadmap', entityId: c.id, action: 'CREATE', newValue: data, changedBy: userId });
  return c;
}

export async function deleteRoadmap(id: string, userId?: string) {
  await executeSQL(`DELETE FROM ssot_probate_roadmaps WHERE id=$1`, id);
  await logChange({ entityType: 'roadmap', entityId: id, action: 'DELETE', changedBy: userId });
}

export async function publishRoadmap(id: string, userId?: string) {
  await executeSQL(`UPDATE ssot_probate_roadmaps SET status='PUBLISHED', published_at=NOW(), published_by=$2, updated_at=NOW() WHERE id=$1`, id, userId||null);
  await logChange({ entityType: 'roadmap', entityId: id, action: 'PUBLISH', changedBy: userId });
}

// ─── Phases ───
export async function listPhases(roadmapId: string) {
  return queryRows(`
    SELECT p.*,
      (SELECT COUNT(*) FROM ssot_roadmap_steps s WHERE s.phase_id = p.id) as step_count
    FROM ssot_roadmap_phases p WHERE p.roadmap_id=$1 ORDER BY p.order_index
  `, roadmapId);
}

export async function upsertPhase(data: any, userId?: string) {
  if (data.id) {
    await executeSQL(`
      UPDATE ssot_roadmap_phases SET roadmap_id=$2, code=$3, title=$4, subtitle=$5,
        description=$6, milestone=$7, order_index=$8, estimated_days=$9, is_optional=$10,
        trigger_condition=$11, source_citation=$12, version=version+1, updated_at=NOW()
      WHERE id=$1
    `, data.id, data.roadmapId, data.code, data.title, data.subtitle||null,
      data.description||null, data.milestone||null, data.orderIndex,
      data.estimatedDays||null, data.isOptional||false,
      data.triggerCondition||null, data.sourceCitation||null);
    await logChange({ entityType: 'phase', entityId: data.id, action: 'UPDATE', newValue: data, changedBy: userId });
    return { id: data.id, ...data };
  }
  const rows = await queryRows(`
    INSERT INTO ssot_roadmap_phases (id, roadmap_id, code, title, subtitle, description,
      milestone, order_index, estimated_days, is_optional, trigger_condition, source_citation)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
  `, data.roadmapId, data.code, data.title, data.subtitle||null,
    data.description||null, data.milestone||null, data.orderIndex,
    data.estimatedDays||null, data.isOptional||false,
    data.triggerCondition||null, data.sourceCitation||null);
  const c = rows[0];
  await logChange({ entityType: 'phase', entityId: c.id, action: 'CREATE', newValue: data, changedBy: userId });
  return c;
}

export async function deletePhase(id: string, userId?: string) {
  await executeSQL(`DELETE FROM ssot_roadmap_phases WHERE id=$1`, id);
  await logChange({ entityType: 'phase', entityId: id, action: 'DELETE', changedBy: userId });
}

// ─── Steps ───
export async function listSteps(phaseId: string) {
  return queryRows(`
    SELECT s.*,
      (SELECT COUNT(*) FROM ssot_step_actions a WHERE a.step_id = s.id) as action_count,
      (SELECT COUNT(*) FROM ssot_step_forms sf WHERE sf.step_id = s.id) as form_count
    FROM ssot_roadmap_steps s WHERE s.phase_id=$1 ORDER BY s.order_index
  `, phaseId);
}

export async function getStep(id: string) {
  const rows = await queryRows(`SELECT * FROM ssot_roadmap_steps WHERE id=$1`, id);
  return rows[0] || null;
}

export async function upsertStep(data: any, userId?: string) {
  if (data.id) {
    await executeSQL(`
      UPDATE ssot_roadmap_steps SET phase_id=$2, code=$3, title=$4, description=$5,
        order_index=$6, estimated_days=$7, is_optional=$8, is_conditional=$9,
        condition_logic=$10::jsonb, responsible_party=$11, requires_attorney=$12,
        requires_court_approval=$13, deadline_rule=$14, deadline_days_from_start=$15,
        risk_warning=$16, rationale=$17, source_citation=$18, version=version+1, updated_at=NOW()
      WHERE id=$1
    `, data.id, data.phaseId, data.code, data.title, data.description||null,
      data.orderIndex, data.estimatedDays||null, data.isOptional||false,
      data.isConditional||false, data.conditionLogic ? JSON.stringify(data.conditionLogic) : null,
      data.responsibleParty||'EXECUTOR', data.requiresAttorney||false,
      data.requiresCourtApproval||false, data.deadlineRule||null,
      data.deadlineDaysFromStart||null, data.riskWarning||null,
      data.rationale||null, data.sourceCitation||null);
    await logChange({ entityType: 'step', entityId: data.id, action: 'UPDATE', newValue: data, changedBy: userId });
    return { id: data.id, ...data };
  }
  const rows = await queryRows(`
    INSERT INTO ssot_roadmap_steps (id, phase_id, code, title, description, order_index,
      estimated_days, is_optional, is_conditional, condition_logic, responsible_party,
      requires_attorney, requires_court_approval, deadline_rule, deadline_days_from_start,
      risk_warning, rationale, source_citation)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *
  `, data.phaseId, data.code, data.title, data.description||null, data.orderIndex,
    data.estimatedDays||null, data.isOptional||false, data.isConditional||false,
    data.conditionLogic ? JSON.stringify(data.conditionLogic) : null,
    data.responsibleParty||'EXECUTOR', data.requiresAttorney||false,
    data.requiresCourtApproval||false, data.deadlineRule||null,
    data.deadlineDaysFromStart||null, data.riskWarning||null,
    data.rationale||null, data.sourceCitation||null);
  const c = rows[0];
  await logChange({ entityType: 'step', entityId: c.id, action: 'CREATE', newValue: data, changedBy: userId });
  return c;
}

export async function deleteStep(id: string, userId?: string) {
  await executeSQL(`DELETE FROM ssot_roadmap_steps WHERE id=$1`, id);
  await logChange({ entityType: 'step', entityId: id, action: 'DELETE', changedBy: userId });
}

// ─── Step Actions ───
export async function listStepActions(stepId: string) {
  return queryRows(`SELECT * FROM ssot_step_actions WHERE step_id=$1 ORDER BY order_index`, stepId);
}

export async function upsertStepAction(data: any, userId?: string) {
  if (data.id) {
    await executeSQL(`
      UPDATE ssot_step_actions SET step_id=$2, code=$3, title=$4, description=$5,
        order_index=$6, responsible_party=$7, deadline_rule=$8, deadline_days=$9,
        is_required=$10, is_blocking=$11, action_type=$12, output_artifact=$13,
        source_citation=$14, version=version+1, updated_at=NOW()
      WHERE id=$1
    `, data.id, data.stepId, data.code, data.title, data.description||null,
      data.orderIndex||0, data.responsibleParty||'EXECUTOR', data.deadlineRule||null,
      data.deadlineDays||null, data.isRequired!==false, data.isBlocking||false,
      data.actionType||'TASK', data.outputArtifact||null, data.sourceCitation||null);
    await logChange({ entityType: 'step_action', entityId: data.id, action: 'UPDATE', newValue: data, changedBy: userId });
    return { id: data.id, ...data };
  }
  const rows = await queryRows(`
    INSERT INTO ssot_step_actions (id, step_id, code, title, description, order_index,
      responsible_party, deadline_rule, deadline_days, is_required, is_blocking,
      action_type, output_artifact, source_citation)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
  `, data.stepId, data.code, data.title, data.description||null,
    data.orderIndex||0, data.responsibleParty||'EXECUTOR', data.deadlineRule||null,
    data.deadlineDays||null, data.isRequired!==false, data.isBlocking||false,
    data.actionType||'TASK', data.outputArtifact||null, data.sourceCitation||null);
  const c = rows[0];
  await logChange({ entityType: 'step_action', entityId: c.id, action: 'CREATE', newValue: data, changedBy: userId });
  return c;
}

export async function deleteStepAction(id: string, userId?: string) {
  await executeSQL(`DELETE FROM ssot_step_actions WHERE id=$1`, id);
  await logChange({ entityType: 'step_action', entityId: id, action: 'DELETE', changedBy: userId });
}

// ─── Step Dependencies ───
export async function listStepDependencies(stepId: string) {
  return queryRows(`
    SELECT d.*, s.code as depends_on_code, s.title as depends_on_title
    FROM ssot_step_dependencies d
    JOIN ssot_roadmap_steps s ON s.id = d.depends_on_step_id
    WHERE d.step_id=$1
  `, stepId);
}

export async function addStepDependency(data: any) {
  const rows = await queryRows(`
    INSERT INTO ssot_step_dependencies (id, step_id, depends_on_step_id, dependency_type, is_blocking)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4)
    ON CONFLICT (step_id, depends_on_step_id) DO NOTHING RETURNING *
  `, data.stepId, data.dependsOnStepId, data.dependencyType||'PREREQUISITE', data.isBlocking!==false);
  return rows[0];
}

export async function removeStepDependency(id: string) {
  await executeSQL(`DELETE FROM ssot_step_dependencies WHERE id=$1`, id);
}

// ─── Step Forms (linking) ───
export async function listStepForms(stepId: string) {
  return queryRows(`
    SELECT sf.*, f.form_number, f.title as form_title, f.category as form_category,
      f.filing_method, f.external_url
    FROM ssot_step_forms sf
    JOIN ssot_legal_forms f ON f.id = sf.form_id
    WHERE sf.step_id=$1 ORDER BY sf.order_index
  `, stepId);
}

export async function linkFormToStep(data: any) {
  const rows = await queryRows(`
    INSERT INTO ssot_step_forms (id, step_id, form_id, is_mandatory, is_conditional, condition_logic, order_index, notes)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5::jsonb,$6,$7)
    ON CONFLICT (step_id, form_id) DO UPDATE SET is_mandatory=$3, is_conditional=$4,
      condition_logic=$5::jsonb, order_index=$6, notes=$7, updated_at=NOW()
    RETURNING *
  `, data.stepId, data.formId, data.isMandatory!==false, data.isConditional||false,
    data.conditionLogic ? JSON.stringify(data.conditionLogic) : null,
    data.orderIndex||0, data.notes||null);
  return rows[0];
}

export async function unlinkFormFromStep(id: string) {
  await executeSQL(`DELETE FROM ssot_step_forms WHERE id=$1`, id);
}
