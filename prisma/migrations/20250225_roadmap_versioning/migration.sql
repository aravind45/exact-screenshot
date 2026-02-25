-- Migration: Add roadmap versioning fields for SSOT pinning
-- Created: 2025-02-25

-- Add roadmap version and pinned timestamp to estates
ALTER TABLE "estates" ADD COLUMN IF NOT EXISTS "roadmap_version" VARCHAR(50);
ALTER TABLE "estates" ADD COLUMN IF NOT EXISTS "roadmap_pinned_at" TIMESTAMP;

-- Add version tracking to settlement types
ALTER TABLE "settlement_types" ADD COLUMN IF NOT EXISTS "version_tag" VARCHAR(50);
ALTER TABLE "settlement_types" ADD COLUMN IF NOT EXISTS "is_published" BOOLEAN DEFAULT false;
ALTER TABLE "settlement_types" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP;

-- Create roadmap versions table for SSOT tracking
CREATE TABLE IF NOT EXISTS "roadmap_versions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "version" VARCHAR(50) NOT NULL,
    "settlement_type_code" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "is_published" BOOLEAN DEFAULT false,
    "published_at" TIMESTAMP,
    "released_at" TIMESTAMP DEFAULT now(),
    "released_by" UUID,
    "changelog" TEXT,
    "schema_hash" VARCHAR(64),
    UNIQUE ("version", "settlement_type_code")
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_roadmap_versions_code" ON "roadmap_versions" ("settlement_type_code");
CREATE INDEX IF NOT EXISTS "idx_roadmap_versions_published" ON "roadmap_versions" ("is_published", "settlement_type_code");

-- Create initial version record for existing estates (NULL version = unpinned)
-- This allows existing estates to automatically use the latest roadmap
