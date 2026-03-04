-- Migration: 040_fix_mock_story_paths.sql
-- Description: Fix mock_story_data image paths: underscore to hyphen (mock_story -> mock-story)
-- The storage bucket uses "mock-story" (hyphen) but the DB had "mock_story" (underscore)

UPDATE story_templates
SET mock_story_data = REPLACE(mock_story_data::text, 'mock_story/', 'mock-story/')::jsonb,
    updated_at = NOW()
WHERE mock_story_data IS NOT NULL
  AND mock_story_data::text LIKE '%mock_story/%';
