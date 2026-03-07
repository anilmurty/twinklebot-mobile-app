-- Migration: 054_rename_cover_images.sql
-- Description: Rename cover image paths so filename matches the folder name
--   e.g. /day-at-the-zoo/cover.png → /day-at-the-zoo/day-at-the-zoo.png
--   Alphabet stories keep their suffix: cover-a-through-i.png → alphabet-general-a-through-i.png
-- Note: Actual files in Supabase Storage must be renamed to match

UPDATE story_templates
SET thumbnail_url = '/day-at-the-zoo/day-at-the-zoo.png'
WHERE thumbnail_url = '/day-at-the-zoo/cover.png';

UPDATE story_templates
SET thumbnail_url = '/counting-general/counting-general.png'
WHERE thumbnail_url = '/counting-general/cover.png';

UPDATE story_templates
SET thumbnail_url = '/alphabet-general/alphabet-general-a-through-i.png'
WHERE thumbnail_url = '/alphabet-general/cover-a-through-i.png';

UPDATE story_templates
SET thumbnail_url = '/alphabet-general/alphabet-general-j-through-r.png'
WHERE thumbnail_url = '/alphabet-general/cover-j-through-r.png';

UPDATE story_templates
SET thumbnail_url = '/alphabet-general/alphabet-general-s-through-z.png'
WHERE thumbnail_url = '/alphabet-general/cover-s-through-z.png';

UPDATE story_templates
SET thumbnail_url = '/mission-to-the-moon/mission-to-the-moon.png'
WHERE thumbnail_url = '/mission-to-the-moon/cover.png';

UPDATE story_templates
SET thumbnail_url = '/field-trip-to-the-fire-station/field-trip-to-the-fire-station.png'
WHERE thumbnail_url = '/field-trip-to-the-fire-station/cover.png';

UPDATE story_templates
SET thumbnail_url = '/visit-to-the-farmers-market/visit-to-the-farmers-market.png'
WHERE thumbnail_url = '/visit-to-the-farmers-market/cover.png';
