-- Migration: 051_consolidate_mock_story_images.sql
-- Description: Consolidate mock-story images with base images
--   Part A: Strip /mock-story/ from all mock_story_data image_url paths
--   Part B: Update insertion_prompt for day-at-the-zoo and counting-general
--           from "put/add the child" to "replace the child" pattern
-- Created: 2026-03-06

-- =============================================================================
-- Part A: Update mock_story_data paths for ALL templates
-- Remove /mock-story/ from image_url paths so they point to base image location
-- e.g. /day-at-the-zoo/mock-story/entrance.png → /day-at-the-zoo/entrance.png
-- =============================================================================

UPDATE story_templates
SET mock_story_data = replace(mock_story_data::text, '/mock-story/', '/')::jsonb
WHERE mock_story_data IS NOT NULL
  AND mock_story_data::text LIKE '%/mock-story/%';

-- =============================================================================
-- Part B: Update insertion_prompt in script_data for day-at-the-zoo and
-- counting-general templates to use "replace the child" pattern
-- (matching the pattern already used by alphabet J-R, S-Z, and mission-to-moon)
-- =============================================================================

DO $$
DECLARE
  template_rec RECORD;
  scenes JSONB;
  scene JSONB;
  new_scenes JSONB;
  base_photo TEXT;
  scene_descriptor TEXT;
  new_prompt TEXT;
  i INTEGER;
BEGIN
  FOR template_rec IN
    SELECT id, title, script_data FROM story_templates
    WHERE title IN ('Day at the Zoo', 'Learning to Count (1 to 10)')
  LOOP
    scenes := template_rec.script_data->'scenes';
    new_scenes := '[]'::jsonb;

    FOR i IN 0..jsonb_array_length(scenes) - 1 LOOP
      scene := scenes->i;
      base_photo := scene->>'base_photo';
      -- Derive scene descriptor from filename: e.g. entrance.png → entrance, 1-one.png → 1-one
      scene_descriptor := replace(base_photo, '.png', '');

      new_prompt := 'replace the child in the ' || scene_descriptor ||
        ' photo with the child in the white background. Match the pose of the child in the ' ||
        scene_descriptor || ' photo. make it look like it was taken with the child from the white background photo';

      scene := jsonb_set(scene, '{insertion_prompt}', to_jsonb(new_prompt));
      new_scenes := new_scenes || jsonb_build_array(scene);
    END LOOP;

    UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', new_scenes)
    WHERE id = template_rec.id;

    RAISE NOTICE 'Updated insertion_prompt for "%" (id: %, % scenes)',
      template_rec.title, template_rec.id, jsonb_array_length(scenes);
  END LOOP;
END $$;
