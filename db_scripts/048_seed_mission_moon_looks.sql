-- Migration: 048_seed_mission_moon_looks.sql
-- Description: Seed character looks for "Mission To The Moon" story template
-- Created: 2026-03-05
--
-- 8 rows total (4 per gender):
-- - Original (display_order: 0, is_original: true)
-- - Astronaut Blue (display_order: 1)
-- - Astronaut Red (display_order: 2)
-- - Astronaut White (display_order: 3)
--
-- Same reference/attire images used for both genders.
-- Images stored in: story-template-assets/mission-to-the-moon/looks/

DO $$
DECLARE
  moon_template_id INTEGER;
  look_order INTEGER := 0;
BEGIN
  -- Get the Mission To The Moon template ID
  SELECT id INTO moon_template_id
  FROM story_templates
  WHERE title = 'Mission To The Moon' AND is_active = true
  LIMIT 1;

  IF moon_template_id IS NOT NULL THEN
    RAISE NOTICE 'Found Mission To The Moon template with ID: %', moon_template_id;

    -- ==================
    -- BOY LOOKS
    -- ==================

    -- Original (boys)
    look_order := 0;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      moon_template_id, 'male', 'Original', look_order,
      'mission-to-the-moon/looks/astronaut-blue-model.png',
      '', '',
      true, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Astronaut Blue (boys)
    look_order := 1;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      moon_template_id, 'male', 'Astronaut Blue', look_order,
      'mission-to-the-moon/looks/astronaut-blue-model.png',
      'mission-to-the-moon/looks/astronaut-blue-suit.png',
      'dress this boy in the astronaut suit shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Astronaut Red (boys)
    look_order := 2;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      moon_template_id, 'male', 'Astronaut Red', look_order,
      'mission-to-the-moon/looks/astronaut-red-model.png',
      'mission-to-the-moon/looks/astronaut-red-suit.png',
      'dress this boy in the astronaut suit shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Astronaut White (boys)
    look_order := 3;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      moon_template_id, 'male', 'Astronaut White', look_order,
      'mission-to-the-moon/looks/astronaut-white-model.png',
      'mission-to-the-moon/looks/astronaut-white-suit.png',
      'dress this boy in the astronaut suit shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- ==================
    -- GIRL LOOKS
    -- ==================

    -- Original (girls)
    look_order := 0;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      moon_template_id, 'female', 'Original', look_order,
      'mission-to-the-moon/looks/astronaut-blue-model.png',
      '', '',
      true, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Astronaut Blue (girls)
    look_order := 1;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      moon_template_id, 'female', 'Astronaut Blue', look_order,
      'mission-to-the-moon/looks/astronaut-blue-model.png',
      'mission-to-the-moon/looks/astronaut-blue-suit.png',
      'dress this girl in the astronaut suit shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Astronaut Red (girls)
    look_order := 2;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      moon_template_id, 'female', 'Astronaut Red', look_order,
      'mission-to-the-moon/looks/astronaut-red-model.png',
      'mission-to-the-moon/looks/astronaut-red-suit.png',
      'dress this girl in the astronaut suit shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    -- Astronaut White (girls)
    look_order := 3;
    INSERT INTO character_looks (
      template_id, gender, look_name, display_order,
      reference_image_url, attire_image_url, prompt_modifier,
      is_original, is_active
    ) VALUES (
      moon_template_id, 'female', 'Astronaut White', look_order,
      'mission-to-the-moon/looks/astronaut-white-model.png',
      'mission-to-the-moon/looks/astronaut-white-suit.png',
      'dress this girl in the astronaut suit shown in the image. keep facial and body features identical to the original image. white background, forward facing and full length',
      false, true
    ) ON CONFLICT (template_id, gender, look_name) DO UPDATE SET
      reference_image_url = EXCLUDED.reference_image_url,
      attire_image_url = EXCLUDED.attire_image_url,
      prompt_modifier = EXCLUDED.prompt_modifier,
      display_order = EXCLUDED.display_order,
      updated_at = NOW();

    RAISE NOTICE 'Seeded looks for Mission To The Moon template';
  ELSE
    RAISE NOTICE 'Mission To The Moon template not found. Please run migration 047_seed_mission_to_the_moon.sql first.';
  END IF;
END $$;
