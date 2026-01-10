-- Migration: 032_seed_alphabet_looks.sql
-- Description: Seed character looks for all alphabet story templates (shared across all 3 alphabet stories)
-- Created: 2026-01-08
-- 
-- This migration adds character looks for all alphabet story templates.
-- The same looks will be used for:
-- - Alphabet Adventures in the Neighborhood (A - I)
-- - Alphabet Adventures in the Neighborhood (J - R) [to be created]
-- - Alphabet Adventures in the Neighborhood (S - Z) [to be created]
--
-- Each look has:
-- - reference_image_url: Model image shown to user in selection UI
-- - attire_image_url: Attire image sent to Replicate API with user's photo
-- - prompt_modifier: Custom prompt to dress the child in this look
--
-- Images are stored in: story-template-assets/alphabet-general/looks/
-- Naming convention: alphabet-{gender}-{style}-{type}.png
--   - gender: boy/girl
--   - style: casual/denim/beanie
--   - type: model/attire

DO $$
DECLARE
  alphabet_a_i_template_id INTEGER;
  alphabet_j_r_template_id INTEGER;
  alphabet_s_z_template_id INTEGER;
  look_order INTEGER := 0;
BEGIN
  -- Get all alphabet template IDs
  SELECT id INTO alphabet_a_i_template_id
  FROM story_templates
  WHERE title = 'Alphabet Adventures in the Neighborhood (A - I)' AND is_active = true
  LIMIT 1;

  SELECT id INTO alphabet_j_r_template_id
  FROM story_templates
  WHERE title = 'Alphabet Adventures in the Neighborhood (J - R)' AND is_active = true
  LIMIT 1;

  SELECT id INTO alphabet_s_z_template_id
  FROM story_templates
  WHERE title = 'Alphabet Adventures in the Neighborhood (S - Z)' AND is_active = true
  LIMIT 1;

  -- Function to insert looks for a template
  -- We'll call this for each template that exists
  IF alphabet_a_i_template_id IS NOT NULL THEN
    RAISE NOTICE 'Found Alphabet Adventures (A - I) template with ID: %', alphabet_a_i_template_id;
    
    -- BOY LOOKS
    -- Look 1: Casual
    look_order := 1;
    INSERT INTO character_looks (
      template_id,
      gender,
      look_name,
      display_order,
      reference_image_url,
      attire_image_url,
      prompt_modifier,
      is_original,
      is_active
    ) VALUES (
      alphabet_a_i_template_id,
      'male',
      'Casual',
      look_order,
      'alphabet-general/looks/alphabet-boy-casual-model.png',
      'alphabet-general/looks/alphabet-boy-casual-attire.png',
      'dress this boy in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false,
      true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Look 2: Denim
    look_order := 2;
    INSERT INTO character_looks (
      template_id,
      gender,
      look_name,
      display_order,
      reference_image_url,
      attire_image_url,
      prompt_modifier,
      is_original,
      is_active
    ) VALUES (
      alphabet_a_i_template_id,
      'male',
      'Denim',
      look_order,
      'alphabet-general/looks/alphabet-boy-denim-model.png',
      'alphabet-general/looks/alphabet-boy-denim-attire.png',
      'dress this boy in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false,
      true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Look 3: Beanie
    look_order := 3;
    INSERT INTO character_looks (
      template_id,
      gender,
      look_name,
      display_order,
      reference_image_url,
      attire_image_url,
      prompt_modifier,
      is_original,
      is_active
    ) VALUES (
      alphabet_a_i_template_id,
      'male',
      'Beanie',
      look_order,
      'alphabet-general/looks/alphabet-boy-beanie-model.png',
      'alphabet-general/looks/alphabet-boy-beanie-attire.png',
      'dress this boy in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false,
      true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Look 4: Original (for boys)
    look_order := 0;
    INSERT INTO character_looks (
      template_id,
      gender,
      look_name,
      display_order,
      reference_image_url,
      attire_image_url,
      prompt_modifier,
      is_original,
      is_active
    ) VALUES (
      alphabet_a_i_template_id,
      'male',
      'Original',
      look_order,
      'alphabet-general/looks/alphabet-boy-casual-model.png', -- Placeholder - will use uploaded photo
      '',
      '',
      true,
      true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- GIRL LOOKS
    -- Look 1: Casual
    look_order := 1;
    INSERT INTO character_looks (
      template_id,
      gender,
      look_name,
      display_order,
      reference_image_url,
      attire_image_url,
      prompt_modifier,
      is_original,
      is_active
    ) VALUES (
      alphabet_a_i_template_id,
      'female',
      'Casual',
      look_order,
      'alphabet-general/looks/alphabet-girl-casual-model.png',
      'alphabet-general/looks/alphabet-girl-casual-attire.png',
      'dress this girl in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false,
      true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Look 2: Denim
    look_order := 2;
    INSERT INTO character_looks (
      template_id,
      gender,
      look_name,
      display_order,
      reference_image_url,
      attire_image_url,
      prompt_modifier,
      is_original,
      is_active
    ) VALUES (
      alphabet_a_i_template_id,
      'female',
      'Denim',
      look_order,
      'alphabet-general/looks/alphabet-girl-denim-model.png',
      'alphabet-general/looks/alphabet-girl-denim-attire.png',
      'dress this girl in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false,
      true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Look 3: Beanie
    look_order := 3;
    INSERT INTO character_looks (
      template_id,
      gender,
      look_name,
      display_order,
      reference_image_url,
      attire_image_url,
      prompt_modifier,
      is_original,
      is_active
    ) VALUES (
      alphabet_a_i_template_id,
      'female',
      'Beanie',
      look_order,
      'alphabet-general/looks/alphabet-girl-beanie-model.png',
      'alphabet-general/looks/alphabet-girl-beanie-attire.png',
      'dress this girl in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false,
      true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Look 4: Original (for girls)
    look_order := 0;
    INSERT INTO character_looks (
      template_id,
      gender,
      look_name,
      display_order,
      reference_image_url,
      attire_image_url,
      prompt_modifier,
      is_original,
      is_active
    ) VALUES (
      alphabet_a_i_template_id,
      'female',
      'Original',
      look_order,
      'alphabet-general/looks/alphabet-girl-casual-model.png', -- Placeholder - will use uploaded photo
      '',
      '',
      true,
      true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    RAISE NOTICE 'Seeded looks for Alphabet Adventures (A - I) template';
  ELSE
    RAISE NOTICE 'Alphabet Adventures (A - I) template not found. Please run migration 031_seed_alphabet_adventures_a_i.sql first.';
  END IF;

  -- Note: When templates for J-R and S-Z are created, this migration can be extended
  -- to add the same looks to those templates as well.
END $$;

