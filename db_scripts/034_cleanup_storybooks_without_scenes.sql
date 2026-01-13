-- Migration: 034_cleanup_storybooks_without_scenes.sql
-- Description: Delete all storybooks that don't have any scenes (NULL, empty array, or invalid)
-- Created: 2026-01-08
--
-- This script removes storybooks where:
-- - scenes IS NULL
-- - scenes is an empty JSONB array []
-- - scenes is not a valid array or has length 0
--
-- Storybooks with at least one scene will be kept.

-- First, let's see what we're about to delete (for safety)
-- Uncomment the SELECT below to preview before running DELETE

-- SELECT 
--   id,
--   title,
--   status,
--   user_id,
--   created_at,
--   scenes,
--   CASE 
--     WHEN scenes IS NULL THEN 'NULL'
--     WHEN jsonb_typeof(scenes) != 'array' THEN 'NOT_ARRAY'
--     WHEN jsonb_array_length(scenes) = 0 THEN 'EMPTY_ARRAY'
--     ELSE 'HAS_SCENES'
--   END as scenes_status
-- FROM storybooks
-- WHERE scenes IS NULL 
--    OR jsonb_typeof(scenes) != 'array'
--    OR jsonb_array_length(COALESCE(scenes, '[]'::jsonb)) = 0;

-- Delete storybooks without scenes
-- This will also cascade delete related records in generation_jobs table
DELETE FROM storybooks
WHERE scenes IS NULL 
   OR jsonb_typeof(scenes) != 'array'
   OR jsonb_array_length(COALESCE(scenes, '[]'::jsonb)) = 0;

-- Log the cleanup (optional - you can check the count manually)
-- The number of deleted rows will be shown when you run this script

