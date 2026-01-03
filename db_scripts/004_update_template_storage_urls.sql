-- Migration: 004_update_template_storage_urls.sql
-- Description: Update story_templates to use Supabase Storage URLs
-- Created: 2024-01-01
--
-- IMPORTANT: Before running this script:
-- 1. Upload thumbnail images to Supabase Storage with descriptive filenames:
--    - story-template-assets/thumbnails/counting-adventure-1-10.jpg
--    - story-template-assets/thumbnails/alphabet-adventure-1-a-i.jpg
--    - story-template-assets/thumbnails/alphabet-adventure-2-j-r.jpg
--    - story-template-assets/thumbnails/alphabet-adventure-3-s-z.jpg
-- 2. Get the public URLs from Supabase Storage
-- 3. Replace the placeholder URLs below with your actual Supabase Storage URLs
--
-- Supabase Storage URL format:
-- https://{project_ref}.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/{descriptive-filename}.jpg

DO $$
DECLARE
  supabase_storage_base_url TEXT;
BEGIN
  -- Get your Supabase project storage base URL
  -- Replace {project_ref} with your actual Supabase project reference
  -- You can find this in Supabase Dashboard → Settings → API → Project URL
  -- Format: https://{project_ref}.supabase.co/storage/v1/object/public/story-template-assets
  
  -- Example: supabase_storage_base_url := 'https://abcdefghijklmnop.supabase.co/storage/v1/object/public/story-template-assets';
  -- Replace the above with your actual URL (without the trailing path)
  
  -- For now, we'll use a placeholder that you need to replace
  supabase_storage_base_url := 'https://cxwiutrjgftozbfpnpvv.supabase.co/storage/v1/object/public/story-template-assets';
  
  -- Update Counting Adventure (template_id = 1)
  UPDATE story_templates
  SET
    thumbnail_url = supabase_storage_base_url || '/thumbnails/counting-adventure-1-10.jpg'
  WHERE title = 'Counting Adventure';
  
  -- Update Alphabet Adventure 1 (template_id = 2)
  UPDATE story_templates
  SET
    thumbnail_url = supabase_storage_base_url || '/thumbnails/alphabet-adventure-1-a-i.jpg'
  WHERE title = 'Alphabet Adventure 1';
  
  -- Update Alphabet Adventure 2 (template_id = 3)
  UPDATE story_templates
  SET
    thumbnail_url = supabase_storage_base_url || '/thumbnails/alphabet-adventure-2-j-r.jpg'
  WHERE title = 'Alphabet Adventure 2';
  
  -- Update Alphabet Adventure 3 (template_id = 4)
  UPDATE story_templates
  SET
    thumbnail_url = supabase_storage_base_url || '/thumbnails/alphabet-adventure-3-s-z.jpg'
  WHERE title = 'Alphabet Adventure 3';
  
  RAISE NOTICE 'Updated storage URLs for all story templates';
  RAISE NOTICE 'Make sure to replace YOUR_PROJECT_REF with your actual Supabase project reference';
END $$;
