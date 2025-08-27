-- Add template fields to study table
-- This script adds template-related fields to the existing study table
-- The new fields are nullable, so existing data will not be affected
-- Existing studies will have NULL values for these fields

ALTER TABLE studies ADD COLUMN template_id BIGINT;
ALTER TABLE studies ADD COLUMN template_locked_at TIMESTAMP;
ALTER TABLE studies ADD COLUMN template_locked_by BIGINT;

-- Add comments for documentation
COMMENT ON COLUMN studies.template_id IS 'ID of the selected template for this study';
COMMENT ON COLUMN studies.template_locked_at IS 'Timestamp when template was locked';
COMMENT ON COLUMN studies.template_locked_by IS 'User ID who locked the template';

-- The migration is complete and safe
