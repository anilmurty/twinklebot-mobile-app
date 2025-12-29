-- Migration: 009_fix_template_thumbnail_urls.sql
-- Description: Fix thumbnail URLs in story_templates to use correct Supabase Storage paths
-- Created: 2024-01-01
--
-- This migration updates existing template records to use the correct storage bucket URLs
-- that match the actual file locations in Supabase Storage.

DO $$
DECLARE
  supabase_storage_base_url TEXT;
BEGIN
  -- Set Supabase Storage base URL
  -- Format: https://{project_ref}.supabase.co/storage/v1/object/public/story-template-assets
  supabase_storage_base_url := 'https://cxwiutrjgftozbfpnpvv.supabase.co/storage/v1/object/public/story-template-assets';
  
  -- Update Counting Adventure
  UPDATE story_templates
  SET thumbnail_url = supabase_storage_base_url || '/thumbnails/counting-adventure-1-10.jpg'
  WHERE title = 'Counting Adventure'
    AND (thumbnail_url LIKE '/counting-numbers%' OR thumbnail_url IS NULL OR thumbnail_url = '');
  
  -- Update Alphabet Adventure 1
  UPDATE story_templates
  SET thumbnail_url = supabase_storage_base_url || '/thumbnails/alphabet-adventure-1-a-i.jpg'
  WHERE title = 'Alphabet Adventure 1'
    AND (thumbnail_url LIKE '/alphabet-letters-a-to-i%' OR thumbnail_url IS NULL OR thumbnail_url = '');
  
  -- Update Alphabet Adventure 2
  UPDATE story_templates
  SET thumbnail_url = supabase_storage_base_url || '/thumbnails/alphabet-adventure-2-j-r.jpg'
  WHERE title = 'Alphabet Adventure 2'
    AND (thumbnail_url LIKE '/alphabet-letters-j-to-r%' OR thumbnail_url IS NULL OR thumbnail_url = '');
  
  -- Update Alphabet Adventure 3
  UPDATE story_templates
  SET thumbnail_url = supabase_storage_base_url || '/thumbnails/alphabet-adventure-3-s-z.jpg'
  WHERE title = 'Alphabet Adventure 3'
    AND (thumbnail_url LIKE '/alphabet-letters-s-to-z%' OR thumbnail_url IS NULL OR thumbnail_url = '');
  
  RAISE NOTICE 'Updated thumbnail URLs for all story templates';
END $$;

