-- Migration: 004_update_template_storage_urls.sql
-- Description: Update story_templates to use Supabase Storage URLs
-- Created: 2024-01-01
--
-- IMPORTANT: Before running this script:
-- 1. Upload cover images to Supabase Storage: story-template-assets/covers/{template_id}.jpg
-- 2. Upload thumbnail images to Supabase Storage: story-template-assets/thumbnails/{template_id}.jpg
-- 3. Get the public URLs from Supabase Storage
-- 4. Replace the placeholder URLs below with your actual Supabase Storage URLs
--
-- Supabase Storage URL format:
-- https://{project_ref}.supabase.co/storage/v1/object/public/story-template-assets/{path}

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
    cover_image_url = supabase_storage_base_url || '/covers/1.jpg',
    thumbnail_url = supabase_storage_base_url || '/thumbnails/1.jpg'
  WHERE title = 'Counting Adventure';
  
  -- Update Alphabet Adventure 1 (template_id = 2)
  UPDATE story_templates
  SET
    cover_image_url = supabase_storage_base_url || '/covers/2.jpg',
    thumbnail_url = supabase_storage_base_url || '/thumbnails/2.jpg'
  WHERE title = 'Alphabet Adventure 1';
  
  -- Update Alphabet Adventure 2 (template_id = 3)
  UPDATE story_templates
  SET
    cover_image_url = supabase_storage_base_url || '/covers/3.jpg',
    thumbnail_url = supabase_storage_base_url || '/thumbnails/3.jpg'
  WHERE title = 'Alphabet Adventure 2';
  
  -- Update Alphabet Adventure 3 (template_id = 4)
  UPDATE story_templates
  SET
    cover_image_url = supabase_storage_base_url || '/covers/4.jpg',
    thumbnail_url = supabase_storage_base_url || '/thumbnails/4.jpg'
  WHERE title = 'Alphabet Adventure 3';
  
  RAISE NOTICE 'Updated storage URLs for all story templates';
  RAISE NOTICE 'Make sure to replace YOUR_PROJECT_REF with your actual Supabase project reference';
END $$;

