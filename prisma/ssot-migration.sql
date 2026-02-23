-- SSOT Probate Engine Migration
-- This migration adds all SSOT tables for the 50-state probate engine

-- ============================================================
-- A. JURISDICTION LAYER
-- ============================================================

CREATE TABLE IF NOT EXISTS "ssot_jurisdictions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "state_code" VARCHAR(2) NOT NULL,
  "state_name" VARCHAR(100) NOT NULL,
  "fips_code" VARCHAR(5),
  "timezone" VARCHAR(50),
  "is_community_property" BOOLEAN NOT NULL DEFAULT false,
  "is_upc_state" BOOLEAN NOT NULL DEFAULT false,
  "has_estate_tax" BOOLEAN NOT NULL DEFAULT false,
  "has_inheritance_tax" BOOLEAN NOT NULL DEFAULT false,
  "small_estate_threshold" DECIMAL(12,2),
  "homestead_exemption_amount" DECIMAL(12,2),
  "spousal_elective_share_pct" DECIMAL(5,2),
  "statute_of_limitations_months" INTEGER,
  "creditor_claim_period_months" INTEGER,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "effective_date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "source_citation" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" TEXT,
  "updated_by" TEXT,
  CONSTRAINT "ssot_jurisdictions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_jurisdictions_state_code_key" ON "ssot_jurisdictions"("state_code");

CREATE TABLE IF NOT EXISTS "ssot_counties" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "jurisdiction_id" TEXT NOT NULL,
  "county_name" VARCHAR(100) NOT NULL,
  "fips_code" VARCHAR(5),
  "court_name" VARCHAR(255),
  "court_address" TEXT,
  "court_phone" VARCHAR(20),
  "court_website" TEXT,
  "efiling_url" TEXT,
  "clerk_email" VARCHAR(255),
  "notes" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_counties_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_counties_jurisdiction_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "ssot_jurisdictions"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_counties_jurisdiction_county_key" ON "ssot_counties"("jurisdiction_id", "county_name");

CREATE TABLE IF NOT EXISTS "ssot_court_types" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "jurisdiction_id" TEXT NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "has_efiling" BOOLEAN NOT NULL DEFAULT false,
  "filing_fee_range" VARCHAR(100),
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_court_types_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_court_types_jurisdiction_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "ssot_jurisdictions"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_court_types_jurisdiction_code_key" ON "ssot_court_types"("jurisdiction_id", "code");

CREATE TABLE IF NOT EXISTS "ssot_probate_types" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
  "typical_duration_months" INTEGER,
  "complexity_tier" INTEGER NOT NULL DEFAULT 2,
  "requires_attorney" BOOLEAN NOT NULL DEFAULT false,
  "requires_court_hearing" BOOLEAN NOT NULL DEFAULT true,
  "requires_bond" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "effective_date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "source_citation" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_probate_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_probate_types_code_key" ON "ssot_probate_types"("code");

CREATE TABLE IF NOT EXISTS "ssot_statute_references" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "jurisdiction_id" TEXT,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" TEXT NOT NULL,
  "statute_code" VARCHAR(100) NOT NULL,
  "statute_title" TEXT,
  "statute_url" TEXT,
  "section_number" VARCHAR(100),
  "effective_date" TIMESTAMPTZ,
  "notes" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_statute_references_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_statute_refs_jurisdiction_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "ssot_jurisdictions"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "ssot_statute_refs_entity_idx" ON "ssot_statute_references"("entity_type", "entity_id");

-- ============================================================
-- B. ROADMAP / WORKFLOW LAYER
-- ============================================================

CREATE TABLE IF NOT EXISTS "ssot_probate_roadmaps" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "jurisdiction_id" TEXT NOT NULL,
  "probate_type_id" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "estimated_duration_months" INTEGER,
  "court_type_id" TEXT,
  "filing_authority" VARCHAR(255),
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "effective_date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "source_citation" TEXT,
  "published_at" TIMESTAMPTZ,
  "published_by" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" TEXT,
  "updated_by" TEXT,
  CONSTRAINT "ssot_probate_roadmaps_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_roadmaps_jurisdiction_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "ssot_jurisdictions"("id") ON DELETE CASCADE,
  CONSTRAINT "ssot_roadmaps_probate_type_fk" FOREIGN KEY ("probate_type_id") REFERENCES "ssot_probate_types"("id") ON DELETE CASCADE,
  CONSTRAINT "ssot_roadmaps_court_type_fk" FOREIGN KEY ("court_type_id") REFERENCES "ssot_court_types"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_roadmaps_jurisdiction_type_key" ON "ssot_probate_roadmaps"("jurisdiction_id", "probate_type_id");
CREATE INDEX IF NOT EXISTS "ssot_roadmaps_status_idx" ON "ssot_probate_roadmaps"("status");

CREATE TABLE IF NOT EXISTS "ssot_roadmap_phases" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "roadmap_id" TEXT NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "subtitle" TEXT,
  "description" TEXT,
  "milestone" VARCHAR(255),
  "order_index" INTEGER NOT NULL,
  "estimated_days" INTEGER,
  "is_optional" BOOLEAN NOT NULL DEFAULT false,
  "trigger_condition" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "source_citation" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_roadmap_phases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_phases_roadmap_fk" FOREIGN KEY ("roadmap_id") REFERENCES "ssot_probate_roadmaps"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_phases_roadmap_code_key" ON "ssot_roadmap_phases"("roadmap_id", "code");
CREATE INDEX IF NOT EXISTS "ssot_phases_order_idx" ON "ssot_roadmap_phases"("roadmap_id", "order_index");

CREATE TABLE IF NOT EXISTS "ssot_roadmap_steps" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "phase_id" TEXT NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "order_index" INTEGER NOT NULL,
  "estimated_days" INTEGER,
  "is_optional" BOOLEAN NOT NULL DEFAULT false,
  "is_conditional" BOOLEAN NOT NULL DEFAULT false,
  "condition_logic" JSONB,
  "responsible_party" VARCHAR(50) NOT NULL DEFAULT 'EXECUTOR',
  "requires_attorney" BOOLEAN NOT NULL DEFAULT false,
  "requires_court_approval" BOOLEAN NOT NULL DEFAULT false,
  "deadline_rule" TEXT,
  "deadline_days_from_start" INTEGER,
  "risk_warning" TEXT,
  "rationale" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "source_citation" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_roadmap_steps_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_steps_phase_fk" FOREIGN KEY ("phase_id") REFERENCES "ssot_roadmap_phases"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_steps_phase_code_key" ON "ssot_roadmap_steps"("phase_id", "code");
CREATE INDEX IF NOT EXISTS "ssot_steps_order_idx" ON "ssot_roadmap_steps"("phase_id", "order_index");

CREATE TABLE IF NOT EXISTS "ssot_step_dependencies" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "step_id" TEXT NOT NULL,
  "depends_on_step_id" TEXT NOT NULL,
  "dependency_type" VARCHAR(20) NOT NULL DEFAULT 'PREREQUISITE',
  "is_blocking" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_step_dependencies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_dep_step_fk" FOREIGN KEY ("step_id") REFERENCES "ssot_roadmap_steps"("id") ON DELETE CASCADE,
  CONSTRAINT "ssot_dep_depends_on_fk" FOREIGN KEY ("depends_on_step_id") REFERENCES "ssot_roadmap_steps"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_dep_step_depends_key" ON "ssot_step_dependencies"("step_id", "depends_on_step_id");

-- ============================================================
-- C. ACTIONS LAYER
-- ============================================================

CREATE TABLE IF NOT EXISTS "ssot_step_actions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "step_id" TEXT NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "order_index" INTEGER NOT NULL DEFAULT 0,
  "responsible_party" VARCHAR(50) NOT NULL DEFAULT 'EXECUTOR',
  "deadline_rule" TEXT,
  "deadline_days" INTEGER,
  "is_required" BOOLEAN NOT NULL DEFAULT true,
  "is_blocking" BOOLEAN NOT NULL DEFAULT false,
  "action_type" VARCHAR(50) NOT NULL DEFAULT 'TASK',
  "output_artifact" VARCHAR(100),
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "source_citation" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_step_actions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_actions_step_fk" FOREIGN KEY ("step_id") REFERENCES "ssot_roadmap_steps"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_actions_step_code_key" ON "ssot_step_actions"("step_id", "code");

-- ============================================================
-- D. FORMS LAYER
-- ============================================================

CREATE TABLE IF NOT EXISTS "ssot_legal_forms" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "form_number" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(100),
  "jurisdiction_id" TEXT,
  "is_universal" BOOLEAN NOT NULL DEFAULT false,
  "filing_method" VARCHAR(20) NOT NULL DEFAULT 'PHYSICAL',
  "filing_fee_amount" DECIMAL(10,2),
  "external_url" TEXT,
  "official_source_url" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "effective_date" TIMESTAMPTZ,
  "source_citation" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_legal_forms_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ssot_legal_forms_jurisdiction_idx" ON "ssot_legal_forms"("jurisdiction_id");
CREATE INDEX IF NOT EXISTS "ssot_legal_forms_number_idx" ON "ssot_legal_forms"("form_number");

CREATE TABLE IF NOT EXISTS "ssot_form_versions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "form_id" TEXT NOT NULL,
  "version_number" VARCHAR(20) NOT NULL,
  "file_url" TEXT,
  "file_storage_key" TEXT,
  "file_size_bytes" INTEGER,
  "effective_date" TIMESTAMPTZ,
  "expiration_date" TIMESTAMPTZ,
  "change_notes" TEXT,
  "is_current" BOOLEAN NOT NULL DEFAULT true,
  "uploaded_by" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_form_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_form_versions_form_fk" FOREIGN KEY ("form_id") REFERENCES "ssot_legal_forms"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ssot_form_versions_form_idx" ON "ssot_form_versions"("form_id");

CREATE TABLE IF NOT EXISTS "ssot_step_forms" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "step_id" TEXT NOT NULL,
  "form_id" TEXT NOT NULL,
  "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
  "is_conditional" BOOLEAN NOT NULL DEFAULT false,
  "condition_logic" JSONB,
  "order_index" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_step_forms_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_step_forms_step_fk" FOREIGN KEY ("step_id") REFERENCES "ssot_roadmap_steps"("id") ON DELETE CASCADE,
  CONSTRAINT "ssot_step_forms_form_fk" FOREIGN KEY ("form_id") REFERENCES "ssot_legal_forms"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_step_forms_step_form_key" ON "ssot_step_forms"("step_id", "form_id");

-- ============================================================
-- E. ESTATE STRUCTURE LAYER
-- ============================================================

CREATE TABLE IF NOT EXISTS "ssot_asset_types" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "probate_inclusion_default" VARCHAR(20) NOT NULL DEFAULT 'INCLUDED',
  "requires_appraisal" BOOLEAN NOT NULL DEFAULT false,
  "typical_transfer_method" VARCHAR(100),
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_asset_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_asset_types_code_key" ON "ssot_asset_types"("code");

CREATE TABLE IF NOT EXISTS "ssot_asset_ownership_types" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "passes_through_probate" BOOLEAN NOT NULL DEFAULT true,
  "transfer_mechanism" VARCHAR(255),
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_asset_ownership_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_asset_ownership_types_code_key" ON "ssot_asset_ownership_types"("code");

CREATE TABLE IF NOT EXISTS "ssot_probate_inclusion_rules" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "jurisdiction_id" TEXT,
  "asset_type_id" TEXT NOT NULL,
  "ownership_type_id" TEXT NOT NULL,
  "inclusion_status" VARCHAR(20) NOT NULL DEFAULT 'INCLUDED',
  "notes" TEXT,
  "source_citation" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_probate_inclusion_rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_inclusion_asset_type_fk" FOREIGN KEY ("asset_type_id") REFERENCES "ssot_asset_types"("id") ON DELETE CASCADE,
  CONSTRAINT "ssot_inclusion_ownership_fk" FOREIGN KEY ("ownership_type_id") REFERENCES "ssot_asset_ownership_types"("id") ON DELETE CASCADE,
  CONSTRAINT "ssot_inclusion_jurisdiction_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "ssot_jurisdictions"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "ssot_liability_types" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "priority_class" VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  "priority_rank" INTEGER NOT NULL DEFAULT 99,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_liability_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_liability_types_code_key" ON "ssot_liability_types"("code");

CREATE TABLE IF NOT EXISTS "ssot_creditor_classes" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "jurisdiction_id" TEXT,
  "class_name" VARCHAR(255) NOT NULL,
  "priority_rank" INTEGER NOT NULL,
  "description" TEXT,
  "source_citation" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_creditor_classes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_creditor_classes_jurisdiction_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "ssot_jurisdictions"("id") ON DELETE SET NULL
);

-- ============================================================
-- F. ACCOUNTING & TAX LAYER
-- ============================================================

CREATE TABLE IF NOT EXISTS "ssot_accounting_rules" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "jurisdiction_id" TEXT,
  "rule_type" VARCHAR(50) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "requirement_level" VARCHAR(20) NOT NULL DEFAULT 'REQUIRED',
  "frequency" VARCHAR(50),
  "deadline_rule" TEXT,
  "deadline_days" INTEGER,
  "source_citation" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_accounting_rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_accounting_rules_jurisdiction_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "ssot_jurisdictions"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "ssot_accounting_rules_type_idx" ON "ssot_accounting_rules"("rule_type");

CREATE TABLE IF NOT EXISTS "ssot_tax_obligations" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "jurisdiction_id" TEXT,
  "tax_type" VARCHAR(50) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "is_federal" BOOLEAN NOT NULL DEFAULT false,
  "applies_to_estates_above" DECIMAL(14,2),
  "tax_rate_info" TEXT,
  "filing_form_number" VARCHAR(50),
  "filing_deadline_rule" TEXT,
  "filing_deadline_days" INTEGER,
  "irs_form_url" TEXT,
  "source_citation" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_tax_obligations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_tax_obligations_jurisdiction_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "ssot_jurisdictions"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "ssot_tax_obligations_type_idx" ON "ssot_tax_obligations"("tax_type");

CREATE TABLE IF NOT EXISTS "ssot_distribution_rules" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "jurisdiction_id" TEXT,
  "code" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "rule_type" VARCHAR(50) NOT NULL DEFAULT 'INTESTACY',
  "condition_logic" JSONB,
  "share_formula" TEXT,
  "priority_order" INTEGER,
  "source_citation" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_distribution_rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_distribution_rules_jurisdiction_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "ssot_jurisdictions"("id") ON DELETE SET NULL
);

-- ============================================================
-- G. STATE OVERRIDE LAYER
-- ============================================================

CREATE TABLE IF NOT EXISTS "ssot_state_overrides" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "jurisdiction_id" TEXT NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" TEXT NOT NULL,
  "override_field" VARCHAR(100) NOT NULL,
  "override_value" JSONB NOT NULL,
  "reason" TEXT,
  "source_citation" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "effective_date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" TEXT,
  CONSTRAINT "ssot_state_overrides_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_overrides_jurisdiction_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "ssot_jurisdictions"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ssot_overrides_entity_idx" ON "ssot_state_overrides"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "ssot_overrides_jurisdiction_idx" ON "ssot_state_overrides"("jurisdiction_id");

-- ============================================================
-- H. AUDIT & CHANGELOG
-- ============================================================

CREATE TABLE IF NOT EXISTS "ssot_change_logs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" TEXT NOT NULL,
  "action" VARCHAR(20) NOT NULL,
  "old_value" JSONB,
  "new_value" JSONB,
  "changed_by" TEXT,
  "change_reason" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_change_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ssot_change_logs_entity_idx" ON "ssot_change_logs"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "ssot_change_logs_created_idx" ON "ssot_change_logs"("created_at" DESC);

-- ============================================================
-- I. PROBATE TYPE AVAILABILITY (Junction for which types exist in which states)
-- ============================================================

CREATE TABLE IF NOT EXISTS "ssot_jurisdiction_probate_types" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "jurisdiction_id" TEXT NOT NULL,
  "probate_type_id" TEXT NOT NULL,
  "is_available" BOOLEAN NOT NULL DEFAULT true,
  "local_name" VARCHAR(255),
  "threshold_amount" DECIMAL(12,2),
  "notes" TEXT,
  "source_citation" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ssot_jurisdiction_probate_types_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssot_jpt_jurisdiction_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "ssot_jurisdictions"("id") ON DELETE CASCADE,
  CONSTRAINT "ssot_jpt_probate_type_fk" FOREIGN KEY ("probate_type_id") REFERENCES "ssot_probate_types"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ssot_jpt_jurisdiction_type_key" ON "ssot_jurisdiction_probate_types"("jurisdiction_id", "probate_type_id");
