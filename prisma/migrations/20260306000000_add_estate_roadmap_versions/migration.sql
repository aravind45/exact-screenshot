-- Per-estate immutable roadmap version snapshots
CREATE TABLE IF NOT EXISTS "estate_roadmap_versions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "estate_id" TEXT NOT NULL,
  "version_number" INTEGER NOT NULL,
  "version_label" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "generation_reason" TEXT NOT NULL,
  "input_snapshot" JSONB NOT NULL,
  "input_hash" TEXT NOT NULL,
  "roadmap_snapshot" JSONB NOT NULL,
  "roadmap_hash" TEXT NOT NULL,
  "change_summary" JSONB,
  "created_by" TEXT,
  "superseded_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "estate_roadmap_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "estate_roadmap_versions_estate_id_fkey"
    FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "estate_roadmap_versions_estate_version_key"
  ON "estate_roadmap_versions" ("estate_id", "version_number");

CREATE INDEX IF NOT EXISTS "estate_roadmap_versions_estate_status_idx"
  ON "estate_roadmap_versions" ("estate_id", "status");

CREATE INDEX IF NOT EXISTS "estate_roadmap_versions_estate_created_idx"
  ON "estate_roadmap_versions" ("estate_id", "created_at");

-- Enforce a single ACTIVE roadmap version per estate.
CREATE UNIQUE INDEX IF NOT EXISTS "estate_roadmap_versions_one_active_per_estate"
  ON "estate_roadmap_versions" ("estate_id")
  WHERE "status" = 'ACTIVE';
