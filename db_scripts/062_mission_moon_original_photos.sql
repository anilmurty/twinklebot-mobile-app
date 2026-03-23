-- Migration: 062_mission_moon_original_photos.sql
-- Description: Update Mission To The Moon scenes 1, 2, and 10 to use child's original photo
--              instead of the character variation, for a more natural look in non-spacesuit scenes.
-- Created: 2026-03-23

UPDATE story_templates
SET script_data = jsonb_set(
  jsonb_set(
    jsonb_set(
      script_data,
      '{scenes,0,child_photo}',  -- scene_number 1 (array index 0)
      '"original"'
    ),
    '{scenes,1,child_photo}',    -- scene_number 2 (array index 1)
    '"original"'
  ),
  '{scenes,9,child_photo}',      -- scene_number 10 (array index 9)
  '"original"'
)
WHERE title = 'Mission To The Moon';
