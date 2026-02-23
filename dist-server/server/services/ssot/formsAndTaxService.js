/**
 * SSOT Forms, Asset/Liability Taxonomy, Accounting & Tax Service
 */
import { queryRows, executeSQL, logChange } from './dbClient.js';
// ─── Legal Forms ───
export async function listLegalForms(jurisdictionId) {
    const where = jurisdictionId ? `WHERE f.jurisdiction_id = $1 OR f.is_universal = true` : '';
    const params = jurisdictionId ? [jurisdictionId] : [];
    return queryRows(`
    SELECT f.*,
      (SELECT COUNT(*) FROM ssot_step_forms sf WHERE sf.form_id = f.id) as linked_step_count,
      j.state_code, j.state_name
    FROM ssot_legal_forms f
    LEFT JOIN ssot_jurisdictions j ON j.id = f.jurisdiction_id
    ${where}
    ORDER BY f.form_number ASC
  `, ...params);
}
export async function getLegalForm(id) {
    const rows = await queryRows(`SELECT * FROM ssot_legal_forms WHERE id=$1`, id);
    return rows[0] || null;
}
export async function upsertLegalForm(data, userId) {
    if (data.id) {
        await executeSQL(`
      UPDATE ssot_legal_forms SET form_number=$2, title=$3, description=$4, category=$5,
        jurisdiction_id=$6, is_universal=$7, filing_method=$8, filing_fee_amount=$9,
        external_url=$10, official_source_url=$11, source_citation=$12,
        effective_date=$13, version=version+1, updated_at=NOW()
      WHERE id=$1
    `, data.id, data.formNumber, data.title, data.description || null, data.category || null, data.jurisdictionId || null, data.isUniversal || false, data.filingMethod || 'PHYSICAL', data.filingFeeAmount || null, data.externalUrl || null, data.officialSourceUrl || null, data.sourceCitation || null, data.effectiveDate || null);
        await logChange({ entityType: 'legal_form', entityId: data.id, action: 'UPDATE', newValue: data, changedBy: userId });
        return { id: data.id, ...data };
    }
    const rows = await queryRows(`
    INSERT INTO ssot_legal_forms (id, form_number, title, description, category,
      jurisdiction_id, is_universal, filing_method, filing_fee_amount, external_url,
      official_source_url, source_citation, effective_date)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
  `, data.formNumber, data.title, data.description || null, data.category || null, data.jurisdictionId || null, data.isUniversal || false, data.filingMethod || 'PHYSICAL', data.filingFeeAmount || null, data.externalUrl || null, data.officialSourceUrl || null, data.sourceCitation || null, data.effectiveDate || null);
    const c = rows[0];
    await logChange({ entityType: 'legal_form', entityId: c.id, action: 'CREATE', newValue: data, changedBy: userId });
    return c;
}
export async function deleteLegalForm(id, userId) {
    await executeSQL(`DELETE FROM ssot_legal_forms WHERE id=$1`, id);
    await logChange({ entityType: 'legal_form', entityId: id, action: 'DELETE', changedBy: userId });
}
// ─── Asset Types ───
export async function listAssetTypes() {
    return queryRows(`SELECT * FROM ssot_asset_types ORDER BY category, name`);
}
export async function upsertAssetType(data, userId) {
    if (data.id) {
        await executeSQL(`
      UPDATE ssot_asset_types SET code=$2, name=$3, category=$4, description=$5,
        probate_inclusion_default=$6, requires_appraisal=$7, typical_transfer_method=$8,
        version=version+1, updated_at=NOW()
      WHERE id=$1
    `, data.id, data.code, data.name, data.category, data.description || null, data.probateInclusionDefault || 'INCLUDED', data.requiresAppraisal || false, data.typicalTransferMethod || null);
        await logChange({ entityType: 'asset_type', entityId: data.id, action: 'UPDATE', newValue: data, changedBy: userId });
        return { id: data.id, ...data };
    }
    const rows = await queryRows(`
    INSERT INTO ssot_asset_types (id, code, name, category, description,
      probate_inclusion_default, requires_appraisal, typical_transfer_method)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7) RETURNING *
  `, data.code, data.name, data.category, data.description || null, data.probateInclusionDefault || 'INCLUDED', data.requiresAppraisal || false, data.typicalTransferMethod || null);
    return rows[0];
}
export async function deleteAssetType(id) {
    await executeSQL(`DELETE FROM ssot_asset_types WHERE id=$1`, id);
}
// ─── Liability Types ───
export async function listLiabilityTypes() {
    return queryRows(`SELECT * FROM ssot_liability_types ORDER BY priority_rank, name`);
}
export async function upsertLiabilityType(data, userId) {
    if (data.id) {
        await executeSQL(`
      UPDATE ssot_liability_types SET code=$2, name=$3, description=$4,
        priority_class=$5, priority_rank=$6, version=version+1, updated_at=NOW()
      WHERE id=$1
    `, data.id, data.code, data.name, data.description || null, data.priorityClass || 'GENERAL', data.priorityRank || 99);
        return { id: data.id, ...data };
    }
    const rows = await queryRows(`
    INSERT INTO ssot_liability_types (id, code, name, description, priority_class, priority_rank)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5) RETURNING *
  `, data.code, data.name, data.description || null, data.priorityClass || 'GENERAL', data.priorityRank || 99);
    return rows[0];
}
export async function deleteLiabilityType(id) {
    await executeSQL(`DELETE FROM ssot_liability_types WHERE id=$1`, id);
}
// ─── Accounting Rules ───
export async function listAccountingRules(jurisdictionId) {
    const where = jurisdictionId ? `WHERE jurisdiction_id = $1 OR jurisdiction_id IS NULL` : '';
    const params = jurisdictionId ? [jurisdictionId] : [];
    return queryRows(`SELECT * FROM ssot_accounting_rules ${where} ORDER BY rule_type, code`, ...params);
}
export async function upsertAccountingRule(data, userId) {
    if (data.id) {
        await executeSQL(`
      UPDATE ssot_accounting_rules SET jurisdiction_id=$2, rule_type=$3, code=$4,
        title=$5, description=$6, requirement_level=$7, frequency=$8,
        deadline_rule=$9, deadline_days=$10, source_citation=$11,
        version=version+1, updated_at=NOW()
      WHERE id=$1
    `, data.id, data.jurisdictionId || null, data.ruleType, data.code, data.title, data.description || null, data.requirementLevel || 'REQUIRED', data.frequency || null, data.deadlineRule || null, data.deadlineDays || null, data.sourceCitation || null);
        return { id: data.id, ...data };
    }
    const rows = await queryRows(`
    INSERT INTO ssot_accounting_rules (id, jurisdiction_id, rule_type, code, title,
      description, requirement_level, frequency, deadline_rule, deadline_days, source_citation)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
  `, data.jurisdictionId || null, data.ruleType, data.code, data.title, data.description || null, data.requirementLevel || 'REQUIRED', data.frequency || null, data.deadlineRule || null, data.deadlineDays || null, data.sourceCitation || null);
    return rows[0];
}
export async function deleteAccountingRule(id) {
    await executeSQL(`DELETE FROM ssot_accounting_rules WHERE id=$1`, id);
}
// ─── Tax Obligations ───
export async function listTaxObligations(jurisdictionId) {
    const where = jurisdictionId ? `WHERE jurisdiction_id = $1 OR is_federal = true` : '';
    const params = jurisdictionId ? [jurisdictionId] : [];
    return queryRows(`SELECT * FROM ssot_tax_obligations ${where} ORDER BY is_federal DESC, tax_type, code`, ...params);
}
export async function upsertTaxObligation(data, userId) {
    if (data.id) {
        await executeSQL(`
      UPDATE ssot_tax_obligations SET jurisdiction_id=$2, tax_type=$3, code=$4,
        title=$5, description=$6, is_federal=$7, applies_to_estates_above=$8,
        tax_rate_info=$9, filing_form_number=$10, filing_deadline_rule=$11,
        filing_deadline_days=$12, irs_form_url=$13, source_citation=$14,
        version=version+1, updated_at=NOW()
      WHERE id=$1
    `, data.id, data.jurisdictionId || null, data.taxType, data.code, data.title, data.description || null, data.isFederal || false, data.appliesToEstatesAbove || null, data.taxRateInfo || null, data.filingFormNumber || null, data.filingDeadlineRule || null, data.filingDeadlineDays || null, data.irsFormUrl || null, data.sourceCitation || null);
        return { id: data.id, ...data };
    }
    const rows = await queryRows(`
    INSERT INTO ssot_tax_obligations (id, jurisdiction_id, tax_type, code, title,
      description, is_federal, applies_to_estates_above, tax_rate_info, filing_form_number,
      filing_deadline_rule, filing_deadline_days, irs_form_url, source_citation)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
  `, data.jurisdictionId || null, data.taxType, data.code, data.title, data.description || null, data.isFederal || false, data.appliesToEstatesAbove || null, data.taxRateInfo || null, data.filingFormNumber || null, data.filingDeadlineRule || null, data.filingDeadlineDays || null, data.irsFormUrl || null, data.sourceCitation || null);
    return rows[0];
}
export async function deleteTaxObligation(id) {
    await executeSQL(`DELETE FROM ssot_tax_obligations WHERE id=$1`, id);
}
// ─── Distribution Rules ───
export async function listDistributionRules(jurisdictionId) {
    const where = jurisdictionId ? `WHERE jurisdiction_id = $1 OR jurisdiction_id IS NULL` : '';
    const params = jurisdictionId ? [jurisdictionId] : [];
    return queryRows(`SELECT * FROM ssot_distribution_rules ${where} ORDER BY priority_order NULLS LAST, code`, ...params);
}
export async function upsertDistributionRule(data, userId) {
    if (data.id) {
        await executeSQL(`
      UPDATE ssot_distribution_rules SET jurisdiction_id=$2, code=$3, title=$4,
        description=$5, rule_type=$6, condition_logic=$7::jsonb, share_formula=$8,
        priority_order=$9, source_citation=$10, version=version+1, updated_at=NOW()
      WHERE id=$1
    `, data.id, data.jurisdictionId || null, data.code, data.title, data.description || null, data.ruleType || 'INTESTACY', data.conditionLogic ? JSON.stringify(data.conditionLogic) : null, data.shareFormula || null, data.priorityOrder || null, data.sourceCitation || null);
        return { id: data.id, ...data };
    }
    const rows = await queryRows(`
    INSERT INTO ssot_distribution_rules (id, jurisdiction_id, code, title, description,
      rule_type, condition_logic, share_formula, priority_order, source_citation)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9) RETURNING *
  `, data.jurisdictionId || null, data.code, data.title, data.description || null, data.ruleType || 'INTESTACY', data.conditionLogic ? JSON.stringify(data.conditionLogic) : null, data.shareFormula || null, data.priorityOrder || null, data.sourceCitation || null);
    return rows[0];
}
export async function deleteDistributionRule(id) {
    await executeSQL(`DELETE FROM ssot_distribution_rules WHERE id=$1`, id);
}
// ─── Change Logs ───
export async function getChangeLogs(entityType, entityId, limit = 50) {
    if (entityType && entityId) {
        return queryRows(`SELECT * FROM ssot_change_logs WHERE entity_type=$1 AND entity_id=$2 ORDER BY created_at DESC LIMIT $3`, entityType, entityId, limit);
    }
    if (entityType) {
        return queryRows(`SELECT * FROM ssot_change_logs WHERE entity_type=$1 ORDER BY created_at DESC LIMIT $2`, entityType, limit);
    }
    return queryRows(`SELECT * FROM ssot_change_logs ORDER BY created_at DESC LIMIT $1`, limit);
}
