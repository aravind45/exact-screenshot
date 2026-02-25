-- Migration: Add roadmap versioning fields and all missing schema elements
-- This migration is idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout)
-- so it can be applied to production databases that may already have some of these
-- objects from previously applied ad-hoc SQL scripts.

-- ══════════════════════════════════════════════════════════════
-- ENUMS (create only if not present)
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE "DocType" AS ENUM ('STATUTE', 'POLICY', 'PLAYBOOK', 'FAQ', 'FORM', 'BLOG', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AdvisorStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PAUSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'NEEDS_REVIEW', 'VERIFIED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_REFUNDED', 'RESOLVED_RELEASED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ADVISOR', 'ATTORNEY', 'EXECUTOR', 'HEIR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- ALTER TABLE profiles — add missing columns
-- ══════════════════════════════════════════════════════════════

ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "personal_email"          TEXT,
  ADD COLUMN IF NOT EXISTS "reset_password_token"    TEXT,
  ADD COLUMN IF NOT EXISTS "reset_password_expires"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "address"                 TEXT,
  ADD COLUMN IF NOT EXISTS "city"                    TEXT,
  ADD COLUMN IF NOT EXISTS "zip"                     TEXT,
  ADD COLUMN IF NOT EXISTS "country"                 TEXT,
  ADD COLUMN IF NOT EXISTS "phone_number"            TEXT,
  ADD COLUMN IF NOT EXISTS "last_ip"                 TEXT,
  ADD COLUMN IF NOT EXISTS "last_login_at"           TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "stripe_customer_id"      TEXT,
  ADD COLUMN IF NOT EXISTS "stripe_subscription_id"  TEXT,
  ADD COLUMN IF NOT EXISTS "subscription_status"     TEXT DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS "trial_started_at"        TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "user_type"               TEXT NOT NULL DEFAULT 'EXECUTOR',
  ADD COLUMN IF NOT EXISTS "email_verified_at"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verification_token"      TEXT,
  ADD COLUMN IF NOT EXISTS "is_pilot"                BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  ALTER TABLE "profiles" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'EXECUTOR';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- ALTER TABLE estates — add missing columns
-- ══════════════════════════════════════════════════════════════

ALTER TABLE "estates"
  ADD COLUMN IF NOT EXISTS "iaea_type"                   TEXT,
  ADD COLUMN IF NOT EXISTS "appointed_date"              TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "hearing_date"                TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "hearing_time"                TEXT,
  ADD COLUMN IF NOT EXISTS "hearing_dept"                TEXT,
  ADD COLUMN IF NOT EXISTS "hearing_address"             TEXT,
  ADD COLUMN IF NOT EXISTS "inbound_email"               TEXT,
  ADD COLUMN IF NOT EXISTS "handle"                      TEXT,
  ADD COLUMN IF NOT EXISTS "settlement_path"             TEXT,
  ADD COLUMN IF NOT EXISTS "is_international"            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "international_reasons"       TEXT[],
  ADD COLUMN IF NOT EXISTS "roadmap_progress"            JSONB,
  ADD COLUMN IF NOT EXISTS "authority_decision"          JSONB,
  ADD COLUMN IF NOT EXISTS "has_minor_beneficiaries"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "has_contest"                 BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "has_primary_residence"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "bond_waiver_status"          TEXT NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN IF NOT EXISTS "guardian_ad_litem_id"        TEXT,
  ADD COLUMN IF NOT EXISTS "guardian_ad_litem_status"    TEXT,
  ADD COLUMN IF NOT EXISTS "special_notice_parties"      JSONB,
  ADD COLUMN IF NOT EXISTS "estimated_liabilities"       DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "has_out_of_state_property"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "has_tod_deed"                BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "has_unknown_heirs"           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_out_of_state"             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_surviving_spouse"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_trust_revocable"          BOOLEAN,
  ADD COLUMN IF NOT EXISTS "administration_type"         TEXT,
  -- KEY COLUMNS for roadmap SSOT versioning pinning
  ADD COLUMN IF NOT EXISTS "roadmap_version"             TEXT,
  ADD COLUMN IF NOT EXISTS "roadmap_pinned_at"           TIMESTAMP(3);

-- Unique constraints on estates (safe with IF NOT EXISTS equivalent)
DO $$ BEGIN
  ALTER TABLE "estates" ADD CONSTRAINT "estates_inbound_email_key" UNIQUE ("inbound_email");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "estates" ADD CONSTRAINT "estates_handle_key" UNIQUE ("handle");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- ALTER TABLE assets — add missing columns
-- ══════════════════════════════════════════════════════════════

ALTER TABLE "assets"
  ADD COLUMN IF NOT EXISTS "date_of_death_value"       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "settled_value"             DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "settled_at"                TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "institution_phone"         TEXT,
  ADD COLUMN IF NOT EXISTS "institution_email"         TEXT,
  ADD COLUMN IF NOT EXISTS "institution_fax"           TEXT,
  ADD COLUMN IF NOT EXISTS "contact_person"            TEXT,
  ADD COLUMN IF NOT EXISTS "inventory_value"           DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "inventory_note"            TEXT,
  ADD COLUMN IF NOT EXISTS "inventory_category"        TEXT,
  ADD COLUMN IF NOT EXISTS "beneficiary_designation"   TEXT,
  ADD COLUMN IF NOT EXISTS "in_trust"                  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "tod_deed_recorded"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "authority_type"            TEXT;

-- ══════════════════════════════════════════════════════════════
-- ALTER TABLE heirs — add missing columns
-- ══════════════════════════════════════════════════════════════

ALTER TABLE "heirs"
  ADD COLUMN IF NOT EXISTS "user_id" TEXT;

DO $$ BEGIN
  ALTER TABLE "heirs" ADD CONSTRAINT "heirs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- ALTER TABLE estate_documents — add missing columns
-- ══════════════════════════════════════════════════════════════

ALTER TABLE "estate_documents"
  ADD COLUMN IF NOT EXISTS "clues" JSONB;

-- ══════════════════════════════════════════════════════════════
-- ALTER TABLE form_templates — add missing columns
-- ══════════════════════════════════════════════════════════════

ALTER TABLE "form_templates"
  ADD COLUMN IF NOT EXISTS "title"       TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "icon"        TEXT DEFAULT 'FileText',
  ADD COLUMN IF NOT EXISTS "state"       TEXT NOT NULL DEFAULT 'CA',
  ADD COLUMN IF NOT EXISTS "category"    TEXT NOT NULL DEFAULT 'General';

-- ══════════════════════════════════════════════════════════════
-- ALTER TABLE deadlines — add missing columns
-- ══════════════════════════════════════════════════════════════

ALTER TABLE "deadlines"
  ADD COLUMN IF NOT EXISTS "warning_id"   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "description"  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "is_completed" BOOLEAN NOT NULL DEFAULT false;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE authority_decisions (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "authority_decisions" (
    "id"           TEXT NOT NULL,
    "estate_id"    TEXT NOT NULL,
    "inputs"       JSONB NOT NULL,
    "decision"     JSONB NOT NULL,
    "rule_version" TEXT NOT NULL,
    "recalc_reason" TEXT,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "authority_decisions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "authority_decisions" ADD CONSTRAINT "authority_decisions_estate_id_fkey"
    FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE estate_grants (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "estate_grants" (
    "id"          TEXT NOT NULL,
    "estate_id"   TEXT NOT NULL,
    "user_id"     TEXT NOT NULL,
    "role"        TEXT NOT NULL,
    "permissions" JSONB,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "estate_grants_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "estate_grants" ADD CONSTRAINT "estate_grants_estate_id_user_id_key" UNIQUE ("estate_id", "user_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "estate_grants" ADD CONSTRAINT "estate_grants_estate_id_fkey"
    FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "estate_grants" ADD CONSTRAINT "estate_grants_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE estate_invitations (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "estate_invitations" (
    "id"          TEXT NOT NULL,
    "estate_id"   TEXT NOT NULL,
    "email"       TEXT NOT NULL,
    "token"       TEXT NOT NULL,
    "role"        TEXT NOT NULL DEFAULT 'VIEWER',
    "status"      TEXT NOT NULL DEFAULT 'PENDING',
    "invited_by"  TEXT NOT NULL,
    "expires_at"  TIMESTAMP(3) NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "payment_id"  TEXT,
    "cost"        DECIMAL(10,2),
    CONSTRAINT "estate_invitations_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "estate_invitations" ADD CONSTRAINT "estate_invitations_token_key" UNIQUE ("token");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "estate_invitations" ADD CONSTRAINT "estate_invitations_estate_id_fkey"
    FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "estate_invitations" ADD CONSTRAINT "estate_invitations_invited_by_fkey"
    FOREIGN KEY ("invited_by") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE distributions (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "distributions" (
    "id"             TEXT NOT NULL,
    "estate_id"      TEXT NOT NULL,
    "heir_id"        TEXT NOT NULL,
    "asset_id"       TEXT,
    "description"    TEXT,
    "amount"         DECIMAL(12,2),
    "percentage"     DOUBLE PRECISION,
    "is_preliminary" BOOLEAN NOT NULL DEFAULT false,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "distributions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "distributions" ADD CONSTRAINT "distributions_asset_id_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "distributions" ADD CONSTRAINT "distributions_estate_id_fkey"
    FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "distributions" ADD CONSTRAINT "distributions_heir_id_fkey"
    FOREIGN KEY ("heir_id") REFERENCES "heirs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE settlement_activities (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "settlement_activities" (
    "id"            TEXT NOT NULL,
    "estate_id"     TEXT NOT NULL,
    "task_id"       TEXT,
    "phase"         TEXT,
    "type"          TEXT NOT NULL DEFAULT 'ROADMAP',
    "action"        TEXT NOT NULL,
    "notes"         TEXT,
    "occurred_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id"       TEXT NOT NULL,
    "hash"          TEXT,
    "previous_hash" TEXT,
    CONSTRAINT "settlement_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "settlement_activities_estate_id_occurred_at_idx"
  ON "settlement_activities"("estate_id", "occurred_at");

DO $$ BEGIN
  ALTER TABLE "settlement_activities" ADD CONSTRAINT "settlement_activities_estate_id_fkey"
    FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "settlement_activities" ADD CONSTRAINT "settlement_activities_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE app_settings (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "app_settings" (
    "key"        TEXT NOT NULL,
    "value"      TEXT NOT NULL,
    "is_secret"  BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE liabilities (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "liabilities" (
    "id"               TEXT NOT NULL,
    "estate_id"        TEXT NOT NULL,
    "name"             TEXT NOT NULL,
    "amount"           DECIMAL(12,2) NOT NULL,
    "status"           TEXT NOT NULL DEFAULT 'DISCOVERED',
    "date_claim_filed" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "allowed_amount"   DECIMAL(12,2),
    "invoice_date"     TIMESTAMP(3),
    "due_date"         TIMESTAMP(3),
    "account_number"   TEXT,
    "notes"            TEXT,
    "contact_phone"    TEXT,
    "contact_email"    TEXT,
    "priority"         TEXT NOT NULL DEFAULT 'MEDIUM',
    "priority_class"   TEXT NOT NULL DEFAULT 'GENERAL_DEBTS',
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,
    "address"          TEXT,
    "city"             TEXT,
    "country"          TEXT DEFAULT 'US',
    "state"            TEXT,
    "zip"              TEXT,
    CONSTRAINT "liabilities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "liabilities_estate_id_idx" ON "liabilities"("estate_id");

DO $$ BEGIN
  ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_estate_id_fkey"
    FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE mailings (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "mailings" (
    "id"           TEXT NOT NULL,
    "estate_id"    TEXT NOT NULL,
    "target_type"  TEXT NOT NULL,
    "target_id"    TEXT NOT NULL,
    "lob_id"       TEXT NOT NULL,
    "status"       TEXT NOT NULL DEFAULT 'PENDING',
    "tracking_url" TEXT,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mailings_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "mailings" ADD CONSTRAINT "mailings_lob_id_key" UNIQUE ("lob_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "mailings_estate_id_idx" ON "mailings"("estate_id");

DO $$ BEGIN
  ALTER TABLE "mailings" ADD CONSTRAINT "mailings_estate_id_fkey"
    FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE discovery_categories (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "discovery_categories" (
    "id"              TEXT NOT NULL,
    "estate_id"       TEXT NOT NULL,
    "category"        TEXT NOT NULL,
    "status"          TEXT NOT NULL DEFAULT 'NOT_CHECKED',
    "evidence_source" TEXT,
    "review_date"     TIMESTAMP(3),
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "discovery_categories_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "discovery_categories"
    ADD CONSTRAINT "discovery_categories_estate_id_category_key" UNIQUE ("estate_id", "category");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "discovery_categories" ADD CONSTRAINT "discovery_categories_estate_id_fkey"
    FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE negative_assurance_logs (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "negative_assurance_logs" (
    "id"                    TEXT NOT NULL,
    "discovery_category_id" TEXT NOT NULL,
    "statement"             TEXT NOT NULL,
    "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "negative_assurance_logs_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "negative_assurance_logs" ADD CONSTRAINT "negative_assurance_logs_discovery_category_id_fkey"
    FOREIGN KEY ("discovery_category_id") REFERENCES "discovery_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE task_completions (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "task_completions" (
    "id"           TEXT NOT NULL,
    "estate_id"    TEXT NOT NULL,
    "task_id"      TEXT NOT NULL,
    "phase"        TEXT,
    "completed"    BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "notes"        TEXT,
    "attachments"  TEXT[],
    CONSTRAINT "task_completions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "task_completions"
    ADD CONSTRAINT "task_completions_estate_id_task_id_key" UNIQUE ("estate_id", "task_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_estate_id_fkey"
    FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE settlement_types (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "settlement_types" (
    "id"           TEXT NOT NULL,
    "code"         TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "description"  TEXT,
    "tier"         INTEGER NOT NULL DEFAULT 1,
    "coverage"     DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active"    BOOLEAN NOT NULL DEFAULT true,
    "version"      INTEGER NOT NULL DEFAULT 1,
    "version_tag"  TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "settlement_types_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "settlement_types" ADD CONSTRAINT "settlement_types_code_key" UNIQUE ("code");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- If table already existed, add the versioning columns
ALTER TABLE "settlement_types"
  ADD COLUMN IF NOT EXISTS "version_tag"  TEXT,
  ADD COLUMN IF NOT EXISTS "is_published" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3);

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE roadmap_versions (key SSOT versioning table)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "roadmap_versions" (
    "id"                   TEXT NOT NULL,
    "version"              TEXT NOT NULL,
    "settlement_type_code" TEXT NOT NULL,
    "is_active"            BOOLEAN NOT NULL DEFAULT true,
    "is_published"         BOOLEAN NOT NULL DEFAULT false,
    "published_at"         TIMESTAMP(3),
    "released_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_by"          TEXT,
    "changelog"            TEXT,
    "schema_hash"          TEXT,
    CONSTRAINT "roadmap_versions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "roadmap_versions"
    ADD CONSTRAINT "roadmap_versions_version_settlement_type_code_key"
    UNIQUE ("version", "settlement_type_code");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "idx_roadmap_versions_code"
  ON "roadmap_versions"("settlement_type_code");

CREATE INDEX IF NOT EXISTS "idx_roadmap_versions_published"
  ON "roadmap_versions"("is_published", "settlement_type_code");

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE roadmap_phases (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "roadmap_phases" (
    "id"                   TEXT NOT NULL,
    "settlement_type_id"   TEXT NOT NULL,
    "phase_code"           TEXT NOT NULL,
    "title"                TEXT NOT NULL,
    "subtitle"             TEXT,
    "description"          TEXT,
    "milestone"            TEXT,
    "order_index"          INTEGER NOT NULL,
    "trigger"              TEXT,
    "trigger_label"        TEXT,
    "is_escalation_path"   BOOLEAN NOT NULL DEFAULT false,
    "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "roadmap_phases_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "roadmap_phases"
    ADD CONSTRAINT "roadmap_phases_settlement_type_id_phase_code_key"
    UNIQUE ("settlement_type_id", "phase_code");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "roadmap_phases" ADD CONSTRAINT "roadmap_phases_settlement_type_id_fkey"
    FOREIGN KEY ("settlement_type_id") REFERENCES "settlement_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE roadmap_tasks (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "roadmap_tasks" (
    "id"                             TEXT NOT NULL,
    "phase_id"                       TEXT NOT NULL,
    "task_code"                      TEXT NOT NULL,
    "title"                          TEXT NOT NULL,
    "description"                    TEXT,
    "estimated_time"                 TEXT,
    "category"                       TEXT,
    "order_index"                    INTEGER NOT NULL,
    "is_optional"                    BOOLEAN NOT NULL DEFAULT false,
    "requires_authority"             BOOLEAN NOT NULL DEFAULT false,
    "required_docs"                  TEXT[],
    "dependencies"                   TEXT[],
    "exclusive_group"                TEXT,
    "track_compatibility"            TEXT[],
    "risk_warning"                   TEXT,
    "rationale"                      TEXT,
    "is_attorney_review_node"        BOOLEAN NOT NULL DEFAULT false,
    "attorney_review_reason"         TEXT,
    "is_conditional"                 BOOLEAN NOT NULL DEFAULT false,
    "conditional_requirement_label"  TEXT,
    "utility"                        TEXT,
    "requires_notary"                BOOLEAN NOT NULL DEFAULT false,
    "requires_physical_mail"         BOOLEAN NOT NULL DEFAULT false,
    "deadline_warning_id"            TEXT,
    "is_international_only"          BOOLEAN NOT NULL DEFAULT false,
    "alerts"                         JSONB,
    "links"                          JSONB,
    "tags"                           TEXT[],
    "primary_action_label"           TEXT,
    "primary_action_url"             TEXT,
    "form_names"                     TEXT[],
    "applicable_variants"            TEXT[],
    "predicates_all"                 TEXT[],
    "predicates_any"                 TEXT[],
    "exclude_predicates"             TEXT[],
    "required_profile_fields"        TEXT[],
    "outputs"                        TEXT[],
    "created_at"                     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                     TIMESTAMP(3) NOT NULL,
    "applicable_states"              TEXT[],
    CONSTRAINT "roadmap_tasks_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "roadmap_tasks"
    ADD CONSTRAINT "roadmap_tasks_phase_id_task_code_key" UNIQUE ("phase_id", "task_code");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_phase_id_fkey"
    FOREIGN KEY ("phase_id") REFERENCES "roadmap_phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE roadmap_task_state_overrides (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "roadmap_task_state_overrides" (
    "id"                         TEXT NOT NULL,
    "task_key"                   TEXT NOT NULL,
    "state_code"                 TEXT NOT NULL,
    "title"                      TEXT,
    "description"                TEXT,
    "form_names"                 TEXT[],
    "primary_action_label"       TEXT,
    "primary_action_url"         TEXT,
    "links"                      JSONB,
    "source_url"                 TEXT,
    "last_verified_at"           TIMESTAMP(3),
    "reviewed_by"                TEXT,
    "change_log"                 JSONB,
    "confidence"                 TEXT DEFAULT 'draft',
    "official_forms"             JSONB,
    "created_at"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                 TIMESTAMP(3) NOT NULL,
    "is_optional"                BOOLEAN,
    "dependencies"               TEXT[],
    CONSTRAINT "roadmap_task_state_overrides_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "roadmap_task_state_overrides"
    ADD CONSTRAINT "roadmap_task_state_overrides_state_code_task_key_key"
    UNIQUE ("state_code", "task_key");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE jurisdiction_rules (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "jurisdiction_rules" (
    "id"                     TEXT NOT NULL,
    "state_code"             TEXT NOT NULL,
    "probate_system"         TEXT NOT NULL DEFAULT 'GENERIC',
    "small_estate_threshold" DECIMAL(12,2) NOT NULL,
    "small_estate_term"      TEXT NOT NULL,
    "claim_window_days"      INTEGER NOT NULL DEFAULT 365,
    "shortened_window_days"  INTEGER,
    "estate_tax_threshold"   DECIMAL(12,2),
    "bond_default_required"  BOOLEAN NOT NULL DEFAULT true,
    "bond_waiver_rules"      JSONB,
    "citations"              JSONB,
    "created_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"             TIMESTAMP(3) NOT NULL,
    CONSTRAINT "jurisdiction_rules_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "jurisdiction_rules"
    ADD CONSTRAINT "jurisdiction_rules_state_code_key" UNIQUE ("state_code");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE transactions (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "transactions" (
    "id"                      TEXT NOT NULL,
    "user_id"                 TEXT NOT NULL,
    "amount"                  DECIMAL(12,2) NOT NULL,
    "currency"                TEXT NOT NULL DEFAULT 'USD',
    "status"                  TEXT NOT NULL DEFAULT 'SUCCESS',
    "stripe_payment_intent_id" TEXT,
    "type"                    TEXT NOT NULL DEFAULT 'PAYMENT',
    "notes"                   TEXT,
    "created_at"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"              TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE rag_documents (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "rag_documents" (
    "id"            TEXT NOT NULL,
    "sourceUri"     TEXT,
    "title"         TEXT NOT NULL,
    "docType"       "DocType" NOT NULL DEFAULT 'OTHER',
    "jurisdiction"  TEXT,
    "effectiveDate" TIMESTAMP(3),
    "version"       TEXT,
    "ingestedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "securityTags"  TEXT[] DEFAULT ARRAY[]::TEXT[],
    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "rag_documents_jurisdiction_idx" ON "rag_documents"("jurisdiction");
CREATE INDEX IF NOT EXISTS "rag_documents_docType_idx" ON "rag_documents"("docType");
CREATE INDEX IF NOT EXISTS "rag_documents_effectiveDate_idx" ON "rag_documents"("effectiveDate");

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE rag_chunks (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "rag_chunks" (
    "id"           TEXT NOT NULL,
    "document_id"  TEXT NOT NULL,
    "parent_id"    TEXT,
    "heading_path" TEXT,
    "section_id"   TEXT,
    "page_start"   INTEGER,
    "page_end"     INTEGER,
    "text"         TEXT NOT NULL,
    "token_count"  INTEGER,
    "content_hash" TEXT NOT NULL,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "rag_chunks"
    ADD CONSTRAINT "rag_chunks_document_id_content_hash_key" UNIQUE ("document_id", "content_hash");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "rag_chunks_document_id_idx" ON "rag_chunks"("document_id");
CREATE INDEX IF NOT EXISTS "rag_chunks_parent_id_idx"   ON "rag_chunks"("parent_id");
CREATE INDEX IF NOT EXISTS "rag_chunks_section_id_idx"  ON "rag_chunks"("section_id");

DO $$ BEGIN
  ALTER TABLE "rag_chunks" ADD CONSTRAINT "rag_chunks_document_id_fkey"
    FOREIGN KEY ("document_id") REFERENCES "rag_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "rag_chunks" ADD CONSTRAINT "rag_chunks_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "rag_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE rag_chunk_embeddings (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "rag_chunk_embeddings" (
    "id"          TEXT NOT NULL,
    "chunk_id"    TEXT NOT NULL,
    "vector_type" TEXT NOT NULL DEFAULT 'content',
    "model_id"    TEXT NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rag_chunk_embeddings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "rag_chunk_embeddings_chunk_id_idx"         ON "rag_chunk_embeddings"("chunk_id");
CREATE INDEX IF NOT EXISTS "rag_chunk_embeddings_vector_type_model_idx" ON "rag_chunk_embeddings"("vector_type", "model_id");

DO $$ BEGIN
  ALTER TABLE "rag_chunk_embeddings" ADD CONSTRAINT "rag_chunk_embeddings_chunk_id_fkey"
    FOREIGN KEY ("chunk_id") REFERENCES "rag_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE agent_executions (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "agent_executions" (
    "id"               TEXT NOT NULL,
    "execution_id"     TEXT NOT NULL,
    "user_id"          TEXT,
    "question"         TEXT NOT NULL,
    "answer"           TEXT NOT NULL,
    "sources"          TEXT[],
    "evidence"         JSONB NOT NULL,
    "metadata"         JSONB NOT NULL,
    "execution_time_ms" INTEGER NOT NULL,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_executions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "agent_executions"
    ADD CONSTRAINT "agent_executions_execution_id_key" UNIQUE ("execution_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "agent_executions_user_id_idx"    ON "agent_executions"("user_id");
CREATE INDEX IF NOT EXISTS "agent_executions_created_at_idx" ON "agent_executions"("created_at");

DO $$ BEGIN
  ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE marketing_events (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "marketing_events" (
    "id"           TEXT NOT NULL,
    "event"        TEXT NOT NULL,
    "email"        TEXT,
    "utm_source"   TEXT,
    "utm_medium"   TEXT,
    "utm_campaign" TEXT,
    "source"       TEXT,
    "metadata"     JSONB,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketing_events_pkey" PRIMARY KEY ("id")
);

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE advisor_profiles (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "advisor_profiles" (
    "id"                        TEXT NOT NULL,
    "user_id"                   TEXT NOT NULL,
    "bio"                       TEXT,
    "expertise"                 TEXT[],
    "hourly_rate"               DECIMAL(10,2) NOT NULL,
    "stripe_account_id"         TEXT,
    "verification_status"       TEXT NOT NULL DEFAULT 'PENDING',
    "license_number"            TEXT,
    "license_document"          TEXT,
    "is_verified"               BOOLEAN NOT NULL DEFAULT false,
    "created_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                TIMESTAMP(3) NOT NULL,
    "profile_image"             TEXT,
    "stripe_details_submitted"  BOOLEAN NOT NULL DEFAULT false,
    "stripe_onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "advisor_type"              TEXT NOT NULL DEFAULT 'ATTORNEY',
    "avg_rating"                DOUBLE PRECISION,
    "buffer_minutes"            INTEGER NOT NULL DEFAULT 15,
    "cancellation_hours"        INTEGER NOT NULL DEFAULT 24,
    "languages"                 TEXT[] DEFAULT ARRAY['English'],
    "max_sessions_per_day"      INTEGER NOT NULL DEFAULT 8,
    "meeting_link"              TEXT,
    "no_show_policy"            TEXT,
    "public_notes"              TEXT,
    "requires_approval"         BOOLEAN NOT NULL DEFAULT false,
    "specialties"               TEXT[] DEFAULT ARRAY[]::TEXT[],
    "states_served"             TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status"                    "AdvisorStatus" NOT NULL DEFAULT 'DRAFT',
    "timezone"                  TEXT NOT NULL DEFAULT 'America/New_York',
    "total_reviews"             INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "advisor_profiles_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "advisor_profiles"
    ADD CONSTRAINT "advisor_profiles_user_id_key" UNIQUE ("user_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "advisor_profiles_status_idx"      ON "advisor_profiles"("status");
CREATE INDEX IF NOT EXISTS "idx_advisor_hourly_rate"          ON "advisor_profiles"("hourly_rate");
CREATE INDEX IF NOT EXISTS "idx_advisor_avg_rating"           ON "advisor_profiles"("avg_rating" DESC);

DO $$ BEGIN
  ALTER TABLE "advisor_profiles" ADD CONSTRAINT "advisor_profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE advisor_license_documents (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "advisor_license_documents" (
    "id"               TEXT NOT NULL,
    "advisor_id"       TEXT NOT NULL,
    "document_type"    TEXT NOT NULL,
    "storage_key"      TEXT NOT NULL,
    "file_name"        TEXT NOT NULL,
    "mime_type"        TEXT NOT NULL,
    "size_bytes"       INTEGER NOT NULL DEFAULT 0,
    "status"           "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "license_number"   TEXT,
    "issuing_state"    TEXT,
    "expiration_date"  TIMESTAMP(3),
    "rejection_reason" TEXT,
    "verified_at"      TIMESTAMP(3),
    "verified_by"      TEXT,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "advisor_license_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "advisor_license_documents_advisor_id_idx"     ON "advisor_license_documents"("advisor_id");
CREATE INDEX IF NOT EXISTS "advisor_license_documents_status_idx"         ON "advisor_license_documents"("status");
CREATE INDEX IF NOT EXISTS "idx_license_expiration"                       ON "advisor_license_documents"("expiration_date");

DO $$ BEGIN
  ALTER TABLE "advisor_license_documents" ADD CONSTRAINT "advisor_license_documents_advisor_id_fkey"
    FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE advisor_rate_plans (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "advisor_rate_plans" (
    "id"               TEXT NOT NULL,
    "advisor_id"       TEXT NOT NULL,
    "service_name"     TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "price_cents"      INTEGER NOT NULL,
    "currency"         TEXT NOT NULL DEFAULT 'USD',
    "description"      TEXT,
    "is_active"        BOOLEAN NOT NULL DEFAULT true,
    "sort_order"       INTEGER NOT NULL DEFAULT 0,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "advisor_rate_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "advisor_rate_plans_advisor_id_idx" ON "advisor_rate_plans"("advisor_id");

DO $$ BEGIN
  ALTER TABLE "advisor_rate_plans" ADD CONSTRAINT "advisor_rate_plans_advisor_id_fkey"
    FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE availability_rules (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "availability_rules" (
    "id"           TEXT NOT NULL,
    "advisor_id"   TEXT NOT NULL,
    "day_of_week"  INTEGER NOT NULL,
    "start_time"   TEXT NOT NULL,
    "end_time"     TEXT NOT NULL,
    "is_active"    BOOLEAN NOT NULL DEFAULT true,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_avail_rule_advisor_day" ON "availability_rules"("advisor_id", "day_of_week");

DO $$ BEGIN
  ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_advisor_id_fkey"
    FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE availability_exceptions (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "availability_exceptions" (
    "id"          TEXT NOT NULL,
    "advisor_id"  TEXT NOT NULL,
    "date"        DATE NOT NULL,
    "is_blackout" BOOLEAN NOT NULL DEFAULT true,
    "start_time"  TEXT,
    "end_time"    TEXT,
    "reason"      TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "availability_exceptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_avail_exception_advisor_date"   ON "availability_exceptions"("advisor_id", "date");
CREATE INDEX IF NOT EXISTS "idx_avail_exception_advisor_date_b" ON "availability_exceptions"("advisor_id", "date");

DO $$ BEGIN
  ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_advisor_id_fkey"
    FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE bookings (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "bookings" (
    "id"                      TEXT NOT NULL,
    "user_id"                 TEXT NOT NULL,
    "advisor_id"              TEXT NOT NULL,
    "estate_id"               TEXT,
    "total_amount"            DECIMAL(10,2) NOT NULL,
    "platform_fee"            DECIMAL(10,2) NOT NULL,
    "advisor_payout"          DECIMAL(10,2) NOT NULL,
    "escrow_release_date"     TIMESTAMP(3),
    "stripe_payment_id"       TEXT,
    "created_at"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"              TIMESTAMP(3) NOT NULL,
    "cancellation_reason"     TEXT,
    "payout_status"           TEXT NOT NULL DEFAULT 'UNPAID',
    "refund_amount"           DECIMAL(10,2),
    "refunded_at"             TIMESTAMP(3),
    "session_date"            TIMESTAMP(3),
    "advisor_notes"           TEXT,
    "cancelled_at"            TIMESTAMP(3),
    "cancelled_by"            TEXT,
    "currency"                TEXT NOT NULL DEFAULT 'USD',
    "duration_minutes"        INTEGER NOT NULL,
    "end_time"                TIMESTAMP(3) NOT NULL,
    "idempotency_key"         TEXT,
    "intake_answers"          JSONB,
    "meeting_link"            TEXT,
    "rate_plan_id"            TEXT,
    "session_duration"        INTEGER,
    "start_time"              TIMESTAMP(3) NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "timezone"                TEXT NOT NULL DEFAULT 'America/New_York',
    "version"                 INTEGER NOT NULL DEFAULT 0,
    "status"                  "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_idempotency_key_key" UNIQUE ("idempotency_key");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_stripe_payment_intent_id_key" UNIQUE ("stripe_payment_intent_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "idx_booking_user"        ON "bookings"("user_id");
CREATE INDEX IF NOT EXISTS "idx_booking_advisor"     ON "bookings"("advisor_id");
CREATE INDEX IF NOT EXISTS "idx_booking_status"      ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "idx_booking_advisor_time" ON "bookings"("advisor_id", "start_time", "end_time");

DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_advisor_id_fkey"
    FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_estate_id_fkey"
    FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_rate_plan_id_fkey"
    FOREIGN KEY ("rate_plan_id") REFERENCES "advisor_rate_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE marketplace_payments (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "marketplace_payments" (
    "id"                      TEXT NOT NULL,
    "booking_id"              TEXT NOT NULL,
    "user_id"                 TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT NOT NULL,
    "stripe_charge_id"        TEXT,
    "amount"                  INTEGER NOT NULL,
    "currency"                TEXT NOT NULL DEFAULT 'USD',
    "status"                  "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "captured_at"             TIMESTAMP(3),
    "refunded_amount"         INTEGER,
    "refunded_at"             TIMESTAMP(3),
    "stripe_refund_id"        TEXT,
    "metadata"                JSONB,
    "created_at"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"              TIMESTAMP(3) NOT NULL,
    CONSTRAINT "marketplace_payments_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "marketplace_payments"
    ADD CONSTRAINT "marketplace_payments_booking_id_key" UNIQUE ("booking_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "marketplace_payments"
    ADD CONSTRAINT "marketplace_payments_stripe_payment_intent_id_key" UNIQUE ("stripe_payment_intent_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "marketplace_payments_booking_id_idx" ON "marketplace_payments"("booking_id");
CREATE INDEX IF NOT EXISTS "marketplace_payments_user_id_idx"    ON "marketplace_payments"("user_id");

DO $$ BEGIN
  ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_booking_id_fkey"
    FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE disputes (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "disputes" (
    "id"            TEXT NOT NULL,
    "booking_id"    TEXT NOT NULL,
    "opened_by"     TEXT NOT NULL,
    "reason"        TEXT NOT NULL,
    "description"   TEXT,
    "status"        "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution"    TEXT,
    "resolved_by"   TEXT,
    "resolved_at"   TIMESTAMP(3),
    "refund_amount" INTEGER,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "disputes"
    ADD CONSTRAINT "disputes_booking_id_key" UNIQUE ("booking_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "disputes_status_idx" ON "disputes"("status");

DO $$ BEGIN
  ALTER TABLE "disputes" ADD CONSTRAINT "disputes_booking_id_fkey"
    FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE reviews (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "reviews" (
    "id"          TEXT NOT NULL,
    "booking_id"  TEXT NOT NULL,
    "user_id"     TEXT NOT NULL,
    "advisor_id"  TEXT NOT NULL,
    "rating"      INTEGER NOT NULL,
    "comment"     TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_booking_id_key" UNIQUE ("booking_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "reviews_advisor_id_idx" ON "reviews"("advisor_id");
CREATE INDEX IF NOT EXISTS "reviews_user_id_idx"    ON "reviews"("user_id");
CREATE INDEX IF NOT EXISTS "reviews_rating_idx"     ON "reviews"("rating");

DO $$ BEGIN
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_advisor_id_fkey"
    FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_fkey"
    FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE admin_action_logs (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "admin_action_logs" (
    "id"          TEXT NOT NULL,
    "admin_id"    TEXT NOT NULL,
    "action"      TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id"   TEXT NOT NULL,
    "reason"      TEXT,
    "metadata"    JSONB,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_action_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_action_logs_admin_id_idx"   ON "admin_action_logs"("admin_id");
CREATE INDEX IF NOT EXISTS "idx_audit_target"                 ON "admin_action_logs"("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "idx_audit_created_at"            ON "admin_action_logs"("created_at" DESC);

DO $$ BEGIN
  ALTER TABLE "admin_action_logs" ADD CONSTRAINT "admin_action_logs_admin_id_fkey"
    FOREIGN KEY ("admin_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE letters_dispatches (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "letters_dispatches" (
    "id"                TEXT NOT NULL,
    "estate_id"         TEXT NOT NULL,
    "institution_name"  TEXT NOT NULL,
    "institution_type"  TEXT NOT NULL,
    "needs_original"    BOOLEAN NOT NULL DEFAULT false,
    "status"            TEXT NOT NULL DEFAULT 'not_sent',
    "sent_at"           TIMESTAMP(3),
    "acknowledged_at"   TIMESTAMP(3),
    "follow_up_due_at"  TIMESTAMP(3),
    "certified_copy_ref" TEXT,
    "notes"             TEXT,
    "is_custom"         BOOLEAN NOT NULL DEFAULT false,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "letters_dispatches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "letters_dispatches_estate_id_status_idx"       ON "letters_dispatches"("estate_id", "status");
CREATE INDEX IF NOT EXISTS "letters_dispatches_estate_id_follow_up_idx"    ON "letters_dispatches"("estate_id", "follow_up_due_at");

DO $$ BEGIN
  ALTER TABLE "letters_dispatches" ADD CONSTRAINT "letters_dispatches_estate_id_fkey"
    FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE TABLE token_blacklist (if not exists)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "token_blacklist" (
    "id"         TEXT NOT NULL,
    "token"      TEXT NOT NULL,
    "expiresAt"  TIMESTAMP(3) NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "token_blacklist_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "token_blacklist" ADD CONSTRAINT "token_blacklist_token_key" UNIQUE ("token");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "token_blacklist_token_idx"     ON "token_blacklist"("token");
CREATE INDEX IF NOT EXISTS "token_blacklist_expiresAt_idx" ON "token_blacklist"("expiresAt");
