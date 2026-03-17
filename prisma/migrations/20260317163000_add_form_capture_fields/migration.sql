-- Add fields needed for cross-form capture normalization
ALTER TABLE "estates"
  ADD COLUMN IF NOT EXISTS "deceased_address" TEXT,
  ADD COLUMN IF NOT EXISTS "publication_newspaper" TEXT;
