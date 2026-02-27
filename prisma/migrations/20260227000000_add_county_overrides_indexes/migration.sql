-- Migration: Add missing indexes and trigger for county_overrides table
-- This migration completes the migration from 20260128000000_add_county_overrides
-- which was only partially applied

-- ══════════════════════════════════════════════════════════════
-- CREATE INDEXES for common query patterns
-- ══════════════════════════════════════════════════════════════

-- Index for querying by state and county (non-unique for faster lookups)
CREATE INDEX IF NOT EXISTS idx_county_overrides_state_county 
  ON public.county_overrides(state_code, county_name);

-- Index for querying by task
CREATE INDEX IF NOT EXISTS idx_county_overrides_task 
  ON public.county_overrides(task_id);

-- Index for published_at filtering (if needed for draft/published states)
CREATE INDEX IF NOT EXISTS idx_county_overrides_published_at 
  ON public.county_overrides(published_at);

-- ══════════════════════════════════════════════════════════════
-- CREATE TRIGGER for updated_at timestamp
-- ══════════════════════════════════════════════════════════════

-- Create trigger to auto-update updated_at timestamp on row updates
CREATE TRIGGER IF NOT EXISTS update_county_overrides_updated_at
  BEFORE UPDATE ON public.county_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════════════════════
-- ADD COMMENT
-- ══════════════════════════════════════════════════════════════

COMMENT ON TABLE public.county_overrides IS 'County-specific overrides for roadmap tasks. Allows customization of task titles, descriptions, fees, forms, and attachments at the county level.';
