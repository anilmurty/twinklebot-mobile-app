-- Migration: 012_cleanup_old_templates.sql
-- Description: Clean up old templates and storybooks, keeping only "Day at the Zoo"
-- Created: 2024-01-01

-- Delete all storybooks (clean slate)
DELETE FROM storybooks;

-- Delete all character variations (if any exist)
DELETE FROM character_variations;

-- Delete all story templates except "Day at the Zoo"
-- First, get the template ID for "Day at the Zoo" if it exists
DO $$
DECLARE
  day_at_zoo_id INTEGER;
BEGIN
  -- Check if "Day at the Zoo" template exists
  SELECT id INTO day_at_zoo_id
  FROM story_templates
  WHERE title = 'Day at the Zoo'
  LIMIT 1;

  -- Delete all templates except "Day at the Zoo"
  IF day_at_zoo_id IS NOT NULL THEN
    DELETE FROM story_templates WHERE id != day_at_zoo_id;
    RAISE NOTICE 'Deleted all templates except "Day at the Zoo" (id: %)', day_at_zoo_id;
  ELSE
    -- If "Day at the Zoo" doesn't exist, delete all templates
    DELETE FROM story_templates;
    RAISE NOTICE 'Deleted all story templates (Day at the Zoo not found)';
  END IF;
END $$;

-- Verify cleanup
DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count FROM story_templates;
  RAISE NOTICE 'Remaining templates: %', template_count;
END $$;

