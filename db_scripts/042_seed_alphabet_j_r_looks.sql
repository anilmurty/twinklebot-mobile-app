-- Migration: 042_seed_alphabet_j_r_looks.sql
-- Description: Seed character looks for Alphabet Adventures (J - R) template
-- Created: 2026-03-05
--
-- Reuses the same look images from alphabet-general/looks/ as A-I

DO $$
DECLARE
  alphabet_j_r_template_id INTEGER;
  look_order INTEGER := 0;
BEGIN
  SELECT id INTO alphabet_j_r_template_id
  FROM story_templates
  WHERE title = 'Alphabet Adventures in the Neighborhood (J - R)' AND is_active = true
  LIMIT 1;

  IF alphabet_j_r_template_id IS NOT NULL THEN
    RAISE NOTICE 'Found Alphabet Adventures (J - R) template with ID: %', alphabet_j_r_template_id;

    -- BOY LOOKS
    -- Look 1: Casual
    look_order := 1;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      alphabet_j_r_template_id, 'male', 'Casual', look_order,
      'alphabet-general/looks/alphabet-boy-casual-model.png',
      'alphabet-general/looks/alphabet-boy-casual-attire.png',
      'dress this boy in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Look 2: Denim
    look_order := 2;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      alphabet_j_r_template_id, 'male', 'Denim', look_order,
      'alphabet-general/looks/alphabet-boy-denim-model.png',
      'alphabet-general/looks/alphabet-boy-denim-attire.png',
      'dress this boy in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Look 3: Beanie
    look_order := 3;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      alphabet_j_r_template_id, 'male', 'Beanie', look_order,
      'alphabet-general/looks/alphabet-boy-beanie-model.png',
      'alphabet-general/looks/alphabet-boy-beanie-attire.png',
      'dress this boy in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Look 4: Original (for boys)
    look_order := 0;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      alphabet_j_r_template_id, 'male', 'Original', look_order,
      'alphabet-general/looks/alphabet-boy-casual-model.png',
      '', '',
      true, true
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
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      alphabet_j_r_template_id, 'female', 'Casual', look_order,
      'alphabet-general/looks/alphabet-girl-casual-model.png',
      'alphabet-general/looks/alphabet-girl-casual-attire.png',
      'dress this girl in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Look 2: Denim
    look_order := 2;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      alphabet_j_r_template_id, 'female', 'Denim', look_order,
      'alphabet-general/looks/alphabet-girl-denim-model.png',
      'alphabet-general/looks/alphabet-girl-denim-attire.png',
      'dress this girl in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Look 3: Beanie
    look_order := 3;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      alphabet_j_r_template_id, 'female', 'Beanie', look_order,
      'alphabet-general/looks/alphabet-girl-beanie-model.png',
      'alphabet-general/looks/alphabet-girl-beanie-attire.png',
      'dress this girl in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Look 4: Frock
    look_order := 4;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      alphabet_j_r_template_id, 'female', 'Frock', look_order,
      'alphabet-general/looks/alphabet-girl-frock-model.png',
      'alphabet-general/looks/alphabet-girl-frock-attire.png',
      'dress this girl in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Look 5: Original (for girls)
    look_order := 0;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      alphabet_j_r_template_id, 'female', 'Original', look_order,
      'alphabet-general/looks/alphabet-girl-casual-model.png',
      '', '',
      true, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    RAISE NOTICE 'Seeded looks for Alphabet Adventures (J - R) template';
  ELSE
    RAISE NOTICE 'Alphabet Adventures (J - R) template not found. Please run migration 041_seed_alphabet_adventures_j_r.sql first.';
  END IF;
END $$;
