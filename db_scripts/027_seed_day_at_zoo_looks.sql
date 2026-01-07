-- Migration: 027_seed_day_at_zoo_looks.sql
-- Description: Seed character looks for "Day at the Zoo" story template
-- Created: 2024-01-01
-- 
-- This migration adds 6 character looks (3 for boys, 3 for girls) for the Day at the Zoo story.
-- Each look has:
-- - reference_image_url: Model image shown to user in selection UI
-- - attire_image_url: Attire image sent to Replicate API with user's photo
-- - prompt_modifier: Custom prompt to dress the child in this look
--
-- Images are stored in: story-template-assets/looks/
-- Naming convention: zoo-{gender}-{style}-{type}.png
--   - gender: boy/girl
--   - style: casual/denim/safari
--   - type: model/attire

DO $$
DECLARE
  day_at_zoo_template_id INTEGER;
  look_order INTEGER := 0;
BEGIN
  -- Get the Day at the Zoo template ID
  SELECT id INTO day_at_zoo_template_id
  FROM story_templates
  WHERE title = 'Day at the Zoo' AND is_active = true
  LIMIT 1;

  IF day_at_zoo_template_id IS NULL THEN
    RAISE EXCEPTION 'Day at the Zoo template not found. Please ensure migration 013_seed_day_at_zoo.sql has been run.';
  END IF;

  RAISE NOTICE 'Found Day at the Zoo template with ID: %', day_at_zoo_template_id;

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
    day_at_zoo_template_id,
    'male',
    'Casual',
    look_order,
    'looks/zoo-boy-casual-model.png',
    'looks/zoo-boy-casual-attire.png',
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
    day_at_zoo_template_id,
    'male',
    'Denim',
    look_order,
    'looks/zoo-boy-denim-model.png',
    'looks/zoo-boy-denim-attire.png',
    'dress this boy in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
    false,
    true
  ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
    reference_image_url = EXCLUDED.reference_image_url,
    attire_image_url = EXCLUDED.attire_image_url,
    prompt_modifier = EXCLUDED.prompt_modifier,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

  -- Look 3: Safari
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
    day_at_zoo_template_id,
    'male',
    'Safari',
    look_order,
    'looks/zoo-boy-safari-model.png',
    'looks/zoo-boy-safari-attire.png',
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
  look_order := 0; -- Original should appear first
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
    day_at_zoo_template_id,
    'male',
    'Original',
    look_order,
    'looks/zoo-boy-casual-model.png', -- Placeholder - will use uploaded photo
    '', -- Not used for original
    '', -- Not used for original
    true,
    true
  ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
    display_order = EXCLUDED.display_order,
    is_original = EXCLUDED.is_original,
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
    day_at_zoo_template_id,
    'female',
    'Casual',
    look_order,
    'looks/zoo-girl-casual-model.png',
    'looks/zoo-girl-casual-attire.png',
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
    day_at_zoo_template_id,
    'female',
    'Denim',
    look_order,
    'looks/zoo-girl-denim-model.png',
    'looks/zoo-girl-denim-attire.png',
    'dress this girl in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
    false,
    true
  ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
    reference_image_url = EXCLUDED.reference_image_url,
    attire_image_url = EXCLUDED.attire_image_url,
    prompt_modifier = EXCLUDED.prompt_modifier,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

  -- Look 3: Safari
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
    day_at_zoo_template_id,
    'female',
    'Safari',
    look_order,
    'looks/zoo-girl-safari-model.png',
    'looks/zoo-girl-safari-attire.png',
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
  look_order := 0; -- Original should appear first
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
    day_at_zoo_template_id,
    'female',
    'Original',
    look_order,
    'looks/zoo-girl-casual-model.png', -- Placeholder - will use uploaded photo
    '', -- Not used for original
    '', -- Not used for original
    true,
    true
  ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
    display_order = EXCLUDED.display_order,
    is_original = EXCLUDED.is_original,
    updated_at = NOW();

  RAISE NOTICE 'Successfully seeded 8 character looks (4 for boys, 4 for girls) for Day at the Zoo template';
END $$;

