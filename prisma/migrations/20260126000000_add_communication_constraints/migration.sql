-- Add CHECK constraints for communications table

-- Type constraint: must be one of the valid communication types
ALTER TABLE "communications" 
ADD CONSTRAINT "communications_type_check" 
CHECK (type IN ('call', 'email', 'letter', 'fax', 'in-person'));

-- Direction constraint: must be inbound or outbound
ALTER TABLE "communications" 
ADD CONSTRAINT "communications_direction_check" 
CHECK (direction IN ('inbound', 'outbound'));

-- Status change constraint: must be one of the valid status values
ALTER TABLE "communications" 
ADD CONSTRAINT "communications_status_change_check" 
CHECK (status_change IS NULL OR status_change IN (
  'initial_contact', 
  'documents_requested', 
  'documents_submitted', 
  'claim_submitted', 
  'under_review', 
  'approved', 
  'payment_received', 
  'completed'
));

-- Occurred at constraint: cannot be in the future
ALTER TABLE "communications" 
ADD CONSTRAINT "communications_occurred_at_not_future" 
CHECK (occurred_at <= NOW());

-- Follow-up date constraint: must be after occurred_at if set
ALTER TABLE "communications" 
ADD CONSTRAINT "communications_follow_up_after_occurred" 
CHECK (follow_up_due_at IS NULL OR follow_up_due_at > occurred_at);

-- Add CHECK constraints for communication_attachments table

-- Size constraint: must be positive and not exceed 10MB
ALTER TABLE "communication_attachments" 
ADD CONSTRAINT "communication_attachments_size_check" 
CHECK (size_bytes > 0 AND size_bytes <= 10485760);

-- MIME type constraint: must be one of the allowed types
ALTER TABLE "communication_attachments" 
ADD CONSTRAINT "communication_attachments_mime_type_check" 
CHECK (mime_type IN (
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
));

-- Create full-text search index using PostgreSQL GIN
-- This enables fast full-text search across subject, notes, institution_name, and contact_name
CREATE INDEX idx_communications_search ON communications 
USING gin(to_tsvector('english', 
  coalesce(subject, '') || ' ' || 
  coalesce(notes, '') || ' ' || 
  coalesce(institution_name, '') || ' ' || 
  coalesce(contact_name, '')
));

-- Create function to validate asset belongs to estate (IDOR protection)
-- This function will be used in application logic to prevent cross-estate access
CREATE OR REPLACE FUNCTION validate_asset_estate(
  p_asset_id TEXT,
  p_estate_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_asset_estate_id TEXT;
BEGIN
  SELECT estate_id INTO v_asset_estate_id
  FROM assets
  WHERE id = p_asset_id;
  
  IF v_asset_estate_id IS NULL THEN
    RETURN FALSE; -- Asset doesn't exist
  END IF;
  
  RETURN v_asset_estate_id = p_estate_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Optional: Create a trigger to enforce asset-estate validation at database level
-- This provides defense-in-depth alongside application-level validation
CREATE OR REPLACE FUNCTION check_communication_asset_estate() 
RETURNS TRIGGER AS $$
BEGIN
  IF NOT validate_asset_estate(NEW.asset_id, NEW.estate_id) THEN
    RAISE EXCEPTION 'Asset does not belong to the specified estate (IDOR protection)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER communications_asset_estate_check
  BEFORE INSERT OR UPDATE ON communications
  FOR EACH ROW
  EXECUTE FUNCTION check_communication_asset_estate();

-- Add comment to document the IDOR protection
COMMENT ON TRIGGER communications_asset_estate_check ON communications IS 
'Validates that the asset belongs to the specified estate to prevent IDOR attacks';
