-- Create function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add county override fields to estates table for SSOT pinning
ALTER TABLE public.estates
  ADD COLUMN IF NOT EXISTS state_ruleset_hash TEXT,
  ADD COLUMN IF NOT EXISTS county_override_id TEXT,
  ADD COLUMN IF NOT EXISTS county_override_hash TEXT;

-- Create county_overrides table
-- This table stores county-specific overrides for roadmap tasks
CREATE TABLE public.county_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code TEXT NOT NULL,
  county_name TEXT NOT NULL,
  task_id TEXT NOT NULL,

  -- Whitelisted fields allowed for override
  title TEXT,
  description TEXT,
  fee_amount DECIMAL(12, 2),
  primary_action_url TEXT,
  form_names TEXT[] DEFAULT '{}',
  attachments JSONB,

  -- Internal tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Unique constraint: one override per state/county/task combination
  CONSTRAINT county_overrides_state_county_task_unique UNIQUE (state_code, county_name, task_id)
);

-- Create index for querying by state and county
CREATE INDEX idx_county_overrides_state_county ON public.county_overrides(state_code, county_name);

-- Create index for querying by task
CREATE INDEX idx_county_overrides_task ON public.county_overrides(task_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_county_overrides_updated_at
  BEFORE UPDATE ON public.county_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.county_overrides IS 'County-specific overrides for roadmap tasks. Allows customization of task titles, descriptions, fees, forms, and attachments at the county level.';
