-- Migration: 011_update_template_structure.sql
-- Description: Update story_templates.script_data structure to include base_photo, child_photo, and insertion_prompt per scene
-- Created: 2024-01-01

-- This migration is informational - the structure will be enforced in the seed script
-- The script_data JSONB structure will now include:
-- {
--   "scenes": [
--     {
--       "scene_number": 1,
--       "script_text": "...",
--       "base_photo": "entrance.jpeg",
--       "child_photo": "front",
--       "insertion_prompt": "...",
--       "aspect_ratio": "match_input_image"
--     }
--   ]
-- }

-- Update comment to reflect new structure
COMMENT ON COLUMN story_templates.script_data IS 'JSONB containing scene-specific scripts with base_photo, child_photo (front/left/right), and insertion_prompt for each scene';
