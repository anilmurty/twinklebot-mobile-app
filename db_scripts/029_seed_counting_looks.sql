-- Migration: 029_seed_counting_looks.sql
-- Description: Seed character looks for "Learning to Count (1 to 10)" story template
-- Created: 2026-01-07

DO $$
DECLARE
  counting_template_id INTEGER;
  look_order INTEGER := 0;
BEGIN
  -- Get the "Learning to Count (1 to 10)" template ID
  SELECT id INTO counting_template_id
  FROM story_templates
  WHERE title = 'Learning to Count (1 to 10)' AND is_active = true
  LIMIT 1;

  IF counting_template_id IS NULL THEN
    RAISE EXCEPTION 'Learning to Count (1 to 10) template not found. Please ensure migration 028_seed_counting_story.sql has been run.';
  END IF;

  RAISE NOTICE 'Found Learning to Count (1 to 10) template with ID: %', counting_template_id;

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
    counting_template_id,
    'male',
    'Casual',
    look_order,
    'counting-general/looks/counting-boy-casual-model.png',
    'counting-general/looks/counting-boy-casual-attire.png',
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
    counting_template_id,
    'male',
    'Denim',
    look_order,
    'counting-general/looks/counting-boy-denim-model.png',
    'counting-general/looks/counting-boy-denim-attire.png',
    'dress this boy in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
    false,
    true
  ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
    reference_image_url = EXCLUDED.reference_image_url,
    attire_image_url = EXCLUDED.attire_image_url,
    prompt_modifier = EXCLUDED.prompt_modifier,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

  -- Look 3: PJ
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
    counting_template_id,
    'male',
    'PJ',
    look_order,
    'counting-general/looks/counting-boy-pj-model.png',
    'counting-general/looks/counting-boy-pj-attire.png',
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
    counting_template_id,
    'male',
    'Original',
    look_order,
    'counting-general/looks/counting-boy-casual-model.png', -- Placeholder - will use uploaded photo
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
    counting_template_id,
    'female',
    'Casual',
    look_order,
    'counting-general/looks/counting-girl-casual-model.png',
    'counting-general/looks/counting-girl-casual-attire.png',
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
    counting_template_id,
    'female',
    'Denim',
    look_order,
    'counting-general/looks/counting-girl-denim-model.png',
    'counting-general/looks/counting-girl-denim-attire.png',
    'dress this girl in the clothing shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
    false,
    true
  ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
    reference_image_url = EXCLUDED.reference_image_url,
    attire_image_url = EXCLUDED.attire_image_url,
    prompt_modifier = EXCLUDED.prompt_modifier,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

  -- Look 3: Frock
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
    counting_template_id,
    'female',
    'Frock',
    look_order,
    'counting-general/looks/counting-girl-frock-model.png',
    'counting-general/looks/counting-girl-frock-attire.png',
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
    counting_template_id,
    'female',
    'Original',
    look_order,
    'counting-general/looks/counting-girl-casual-model.png', -- Placeholder - will use uploaded photo
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

  RAISE NOTICE 'Successfully seeded character looks for Learning to Count (1 to 10) template';
END $$;

