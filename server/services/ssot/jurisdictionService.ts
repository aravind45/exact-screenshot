/**
 * SSOT Jurisdiction Service - CRUD for jurisdictions, counties, court types, probate types
 */
import { queryRows, executeSQL, logChange, type SSOTStatus } from './dbClient.js';

// ─── Jurisdictions ───
export async function listJurisdictions(status?: SSOTStatus) {
  const where = status ? `WHERE j.status = $1` : '';
  const params = status ? [status] : [];
  return queryRows(`
    SELECT j.*,
      (SELECT COUNT(*) FROM ssot_probate_roadmaps r WHERE r.jurisdiction_id = j.id) as roadmap_count,
      (SELECT COUNT(*) FROM ssot_counties c WHERE c.jurisdiction_id = j.id) as county_count
    FROM ssot_jurisdictions j ${where}
    ORDER BY j.state_name ASC
  `, ...params);
}

export async function getJurisdiction(id: string) {
  const rows = await queryRows(`SELECT * FROM ssot_jurisdictions WHERE id = $1`, id);
  return rows[0] || null;
}

export async function getJurisdictionByState(stateCode: string) {
  const rows = await queryRows(`SELECT * FROM ssot_jurisdictions WHERE state_code = $1`, stateCode);
  return rows[0] || null;
}

export async function upsertJurisdiction(data: any, userId?: string) {
  const existing = data.id ? await getJurisdiction(data.id) : null;
  if (existing) {
    await executeSQL(`
      UPDATE ssot_jurisdictions SET
        state_code = $2, state_name = $3, fips_code = $4, timezone = $5,
        is_community_property = $6, is_upc_state = $7, has_estate_tax = $8,
        has_inheritance_tax = $9, small_estate_threshold = $10,
        homestead_exemption_amount = $11, spousal_elective_share_pct = $12,
        statute_of_limitations_months = $13, creditor_claim_period_months = $14,
        source_citation = $15, version = version + 1,
        updated_at = NOW(), updated_by = $16
      WHERE id = $1
    `, data.id, data.stateCode, data.stateName, data.fipsCode || null,
      data.timezone || null, data.isCommunityProperty || false,
      data.isUpcState || false, data.hasEstateTax || false,
      data.hasInheritanceTax || false, data.smallEstateThreshold || null,
      data.homesteadExemptionAmount || null, data.spousalElectiveSharePct || null,
      data.statuteOfLimitationsMonths || null, data.creditorClaimPeriodMonths || null,
      data.sourceCitation || null, userId || null);
    await logChange({ entityType: 'jurisdiction', entityId: data.id, action: 'UPDATE', oldValue: existing, newValue: data, changedBy: userId });
    return { ...existing, ...data };
  }
  const rows = await queryRows(`
    INSERT INTO ssot_jurisdictions (id, state_code, state_name, fips_code, timezone,
      is_community_property, is_upc_state, has_estate_tax, has_inheritance_tax,
      small_estate_threshold, homestead_exemption_amount, spousal_elective_share_pct,
      statute_of_limitations_months, creditor_claim_period_months, source_citation,
      created_by, updated_by)
    VALUES (gen_random_uuid()::text, $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)
    RETURNING *
  `, data.stateCode, data.stateName, data.fipsCode || null, data.timezone || null,
    data.isCommunityProperty || false, data.isUpcState || false,
    data.hasEstateTax || false, data.hasInheritanceTax || false,
    data.smallEstateThreshold || null, data.homesteadExemptionAmount || null,
    data.spousalElectiveSharePct || null, data.statuteOfLimitationsMonths || null,
    data.creditorClaimPeriodMonths || null, data.sourceCitation || null, userId || null);
  const created = rows[0];
  await logChange({ entityType: 'jurisdiction', entityId: created.id, action: 'CREATE', newValue: data, changedBy: userId });
  return created;
}

export async function deleteJurisdiction(id: string, userId?: string) {
  const existing = await getJurisdiction(id);
  await executeSQL(`DELETE FROM ssot_jurisdictions WHERE id = $1`, id);
  if (existing) await logChange({ entityType: 'jurisdiction', entityId: id, action: 'DELETE', oldValue: existing, changedBy: userId });
}

// ─── Probate Types ───
export async function listProbateTypes() {
  return queryRows(`SELECT * FROM ssot_probate_types ORDER BY code ASC`);
}

export async function getProbateType(id: string) {
  const rows = await queryRows(`SELECT * FROM ssot_probate_types WHERE id = $1`, id);
  return rows[0] || null;
}

export async function upsertProbateType(data: any, userId?: string) {
  const existing = data.id ? await getProbateType(data.id) : null;
  if (existing) {
    await executeSQL(`
      UPDATE ssot_probate_types SET
        code=$2, name=$3, description=$4, category=$5, typical_duration_months=$6,
        complexity_tier=$7, requires_attorney=$8, requires_court_hearing=$9,
        requires_bond=$10, source_citation=$11, version=version+1, updated_at=NOW()
      WHERE id=$1
    `, data.id, data.code, data.name, data.description||null, data.category||'STANDARD',
      data.typicalDurationMonths||null, data.complexityTier||2,
      data.requiresAttorney||false, data.requiresCourtHearing||true,
      data.requiresBond||false, data.sourceCitation||null);
    await logChange({ entityType: 'probate_type', entityId: data.id, action: 'UPDATE', oldValue: existing, newValue: data, changedBy: userId });
    return { ...existing, ...data };
  }
  const rows = await queryRows(`
    INSERT INTO ssot_probate_types (id, code, name, description, category, typical_duration_months,
      complexity_tier, requires_attorney, requires_court_hearing, requires_bond, source_citation)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
  `, data.code, data.name, data.description||null, data.category||'STANDARD',
    data.typicalDurationMonths||null, data.complexityTier||2,
    data.requiresAttorney||false, data.requiresCourtHearing||true,
    data.requiresBond||false, data.sourceCitation||null);
  const created = rows[0];
  await logChange({ entityType: 'probate_type', entityId: created.id, action: 'CREATE', newValue: data, changedBy: userId });
  return created;
}

export async function deleteProbateType(id: string, userId?: string) {
  await executeSQL(`DELETE FROM ssot_probate_types WHERE id = $1`, id);
  await logChange({ entityType: 'probate_type', entityId: id, action: 'DELETE', changedBy: userId });
}

// ─── Statute References (polymorphic) ───
export async function listStatuteReferences(entityType: string, entityId: string) {
  return queryRows(`SELECT * FROM ssot_statute_references WHERE entity_type=$1 AND entity_id=$2 ORDER BY statute_code`, entityType, entityId);
}

export async function upsertStatuteReference(data: any, userId?: string) {
  if (data.id) {
    await executeSQL(`
      UPDATE ssot_statute_references SET
        jurisdiction_id=$2, entity_type=$3, entity_id=$4, statute_code=$5,
        statute_title=$6, statute_url=$7, section_number=$8, effective_date=$9,
        notes=$10, version=version+1, updated_at=NOW()
      WHERE id=$1
    `, data.id, data.jurisdictionId||null, data.entityType, data.entityId,
      data.statuteCode, data.statuteTitle||null, data.statuteUrl||null,
      data.sectionNumber||null, data.effectiveDate||null, data.notes||null);
    return data;
  }
  const rows = await queryRows(`
    INSERT INTO ssot_statute_references (id, jurisdiction_id, entity_type, entity_id,
      statute_code, statute_title, statute_url, section_number, effective_date, notes)
    VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
  `, data.jurisdictionId||null, data.entityType, data.entityId,
    data.statuteCode, data.statuteTitle||null, data.statuteUrl||null,
    data.sectionNumber||null, data.effectiveDate||null, data.notes||null);
  return rows[0];
}

export async function deleteStatuteReference(id: string) {
  await executeSQL(`DELETE FROM ssot_statute_references WHERE id=$1`, id);
}

// ─── Publishing ───
export async function publishJurisdiction(id: string, userId?: string) {
  await executeSQL(`UPDATE ssot_jurisdictions SET status='PUBLISHED', updated_at=NOW(), updated_by=$2 WHERE id=$1`, id, userId||null);
  await logChange({ entityType: 'jurisdiction', entityId: id, action: 'PUBLISH', changedBy: userId });
}

export async function publishProbateType(id: string, userId?: string) {
  await executeSQL(`UPDATE ssot_probate_types SET status='PUBLISHED', updated_at=NOW() WHERE id=$1`, id);
  await logChange({ entityType: 'probate_type', entityId: id, action: 'PUBLISH', changedBy: userId });
}
