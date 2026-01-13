-- Migration: 033_add_mock_story_data_to_templates.sql
-- Description: Add mock_story_data field to story_templates table for preview/demo stories
-- Created: 2026-01-08
--
-- This field will store pre-generated mock story scenes using a model child,
-- allowing users to preview stories before creating their own (paid) version.

-- Add mock_story_data column to story_templates table
ALTER TABLE story_templates
ADD COLUMN IF NOT EXISTS mock_story_data JSONB DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN story_templates.mock_story_data IS 'Pre-generated mock story scenes with model child images for free preview. Structure matches script_data.scenes but with image_url instead of base_photo.';

-- Create index for faster queries (though this is optional for JSONB)
CREATE INDEX IF NOT EXISTS idx_story_templates_mock_story_data ON story_templates USING GIN (mock_story_data);

