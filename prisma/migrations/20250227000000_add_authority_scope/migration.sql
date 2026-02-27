-- Add authorityScope to RoadmapTask model
-- This field tracks which authority track (PROBATE, TRUST, or BOTH) a task belongs to
-- Used for fail-closed filtering to prevent module leakage

ALTER TABLE "roadmap_tasks" ADD COLUMN "authority_scope" TEXT;

-- Add estateAuthorityType to Estate model
-- This field stores the computed authority type at pin time
-- Used to maintain pinning stability even if activeEngines changes

ALTER TABLE "estates" ADD COLUMN "estate_authority_type" TEXT;

-- Create index on authority_scope for faster filtering
CREATE INDEX "roadmap_tasks_authority_scope_idx" ON "roadmap_tasks"("authority_scope");

-- Create index on estate_authority_type for faster queries
CREATE INDEX "estates_estate_authority_type_idx" ON "estates"("estate_authority_type");
