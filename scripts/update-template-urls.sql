-- Quick script to update template thumbnail URLs
-- Run this in Supabase SQL Editor after uploading images

-- Replace YOUR_PROJECT_REF with your actual Supabase project reference
-- You can find this in Supabase Dashboard → Settings → API → Project URL

UPDATE story_templates
SET thumbnail_url = 'https://cxwiutrjgftozbfpnpvv.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/counting-adventure-1-10.jpg'
WHERE title = 'Counting Adventure';

UPDATE story_templates
SET thumbnail_url = 'https://cxwiutrjgftozbfpnpvv.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/alphabet-adventure-1-a-i.jpg'
WHERE title = 'Alphabet Adventure 1';

UPDATE story_templates
SET thumbnail_url = 'https://cxwiutrjgftozbfpnpvv.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/alphabet-adventure-2-j-r.jpg'
WHERE title = 'Alphabet Adventure 2';

UPDATE story_templates
SET thumbnail_url = 'https://cxwiutrjgftozbfpnpvv.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/alphabet-adventure-3-s-z.jpg'
WHERE title = 'Alphabet Adventure 3';

-- Verify the URLs were updated
SELECT id, title, thumbnail_url FROM story_templates ORDER BY id;

