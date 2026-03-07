-- Migration 052: Generic character looks
-- Allows template_id to be NULL for generic (default) looks that apply to all templates
-- Seeds 10 generic looks (5 per gender) and updates mission-to-moon Original looks

-- ============================================
-- A. Schema change: allow NULL template_id
-- ============================================

-- Allow NULL template_id for generic looks
ALTER TABLE character_looks ALTER COLUMN template_id DROP NOT NULL;

-- Drop the existing unique constraint (template_id, gender, look_name)
ALTER TABLE character_looks DROP CONSTRAINT IF EXISTS character_looks_template_id_gender_look_name_key;

-- Create partial unique index for template-specific looks
CREATE UNIQUE INDEX IF NOT EXISTS character_looks_template_gender_name_unique
  ON character_looks (template_id, gender, look_name)
  WHERE template_id IS NOT NULL;

-- Create partial unique index for generic looks (template_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS character_looks_generic_gender_name_unique
  ON character_looks (gender, look_name)
  WHERE template_id IS NULL;

-- ============================================
-- B. Seed 10 generic looks (template_id = NULL)
-- ============================================

INSERT INTO character_looks (template_id, gender, look_name, reference_image_url, attire_image_url, prompt_modifier, is_original, is_active, display_order)
VALUES
  -- Male looks
  (NULL, 'male', 'Original', '', '', 'keep this boy in their current outfit. keep facial and body features identical to the original image. white background, forward facing and full length', true, true, 0),
  (NULL, 'male', 'Beanie', 'looks/boy-beanie-model.png', 'looks/boy-beanie-attire.png', 'dress this boy in the beanie outfit shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length', false, true, 1),
  (NULL, 'male', 'Casual', 'looks/boy-casual-model.png', 'looks/boy-casual-attire.png', 'dress this boy in the casual outfit shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length', false, true, 2),
  (NULL, 'male', 'Denim', 'looks/boy-denim-model.png', 'looks/boy-denim-attire.png', 'dress this boy in the denim outfit shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length', false, true, 3),
  (NULL, 'male', 'Pajamas', 'looks/boy-pj-model.png', 'looks/boy-pj-attire.png', 'dress this boy in the pajamas shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length', false, true, 4),
  -- Female looks
  (NULL, 'female', 'Original', '', '', 'keep this girl in their current outfit. keep facial and body features identical to the original image. white background, forward facing and full length', true, true, 0),
  (NULL, 'female', 'Beanie', 'looks/girl-beanie-model.png', 'looks/girl-beanie-attire.png', 'dress this girl in the beanie outfit shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length', false, true, 1),
  (NULL, 'female', 'Casual', 'looks/girl-casual-model.png', 'looks/girl-casual-attire.png', 'dress this girl in the casual outfit shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length', false, true, 2),
  (NULL, 'female', 'Denim', 'looks/girl-denim-model.png', 'looks/girl-denim-attire.png', 'dress this girl in the denim outfit shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length', false, true, 3),
  (NULL, 'female', 'Frock', 'looks/girl-frock-model.png', 'looks/girl-frock-attire.png', 'dress this girl in the frock shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length', false, true, 4)
ON CONFLICT DO NOTHING;

-- ============================================
-- C. Update mission-to-moon Original looks
-- ============================================

-- Set prompt_modifier and clear reference_image_url for Original looks on Mission To The Moon
UPDATE character_looks
SET
  prompt_modifier = 'keep this boy in their current outfit. keep facial and body features identical to the original image. white background, forward facing and full length',
  reference_image_url = ''
WHERE template_id = (SELECT id FROM story_templates WHERE title = 'Mission To The Moon')
  AND gender = 'male'
  AND look_name = 'Original';

UPDATE character_looks
SET
  prompt_modifier = 'keep this girl in their current outfit. keep facial and body features identical to the original image. white background, forward facing and full length',
  reference_image_url = ''
WHERE template_id = (SELECT id FROM story_templates WHERE title = 'Mission To The Moon')
  AND gender = 'female'
  AND look_name = 'Original';
