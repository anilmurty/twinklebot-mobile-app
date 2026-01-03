-- Migration: 008_remove_cover_image_url.sql
-- Description: Remove cover_image_url column from story_templates table
-- Created: 2024-01-01

-- Remove the cover_image_url column from story_templates
ALTER TABLE story_templates
DROP COLUMN IF EXISTS cover_image_url;

COMMENT ON TABLE story_templates IS 'Story templates for generating personalized storybooks. Each template has a thumbnail_url for list view display.';
