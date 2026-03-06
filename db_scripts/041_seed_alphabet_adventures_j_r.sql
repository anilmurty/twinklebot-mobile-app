-- Migration: 041_seed_alphabet_adventures_j_r.sql
-- Description: Seed "Alphabet Adventures in the Neighborhood (J - R)" story template with 9 scenes
-- Also updates A-I cover thumbnail to match renamed file
-- Created: 2026-03-05

DO $$
DECLARE
  nano_banana_pro_model_id INTEGER;
  existing_template_id INTEGER;
  template_data JSONB;
BEGIN
  -- Update A-I template thumbnail to match renamed cover file
  UPDATE story_templates
  SET thumbnail_url = '/alphabet-general/cover-a-through-i.png'
  WHERE title = 'Alphabet Adventures in the Neighborhood (A - I)'
    AND thumbnail_url = '/alphabet-general/cover.png';

  -- Get the nano-banana-pro model ID
  SELECT id INTO nano_banana_pro_model_id
  FROM generation_models
  WHERE name = 'nano-banana-pro' AND is_active = true
  LIMIT 1;

  IF nano_banana_pro_model_id IS NULL THEN
    RAISE EXCEPTION 'nano-banana-pro model not found. Please run migration 017_add_nano_banana_pro_model.sql first.';
  END IF;

  -- Prepare template data
  template_data := '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "J for Jam",
        "script_text": "J is for Jam in jars so neat,\n[Name] spots one that looks so sweet.",
        "base_photo": "j-jam.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the jam photo with the child in the white background. Match the pose of the child in the jam photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "K for Kite",
        "script_text": "K is for Kite flying up high,\n[Name] watches it dance in the sky.",
        "base_photo": "k-kite.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the kite photo with the child in the white background. Match the pose of the child in the kite photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "L for Leaf",
        "script_text": "L is for Leaf drifting down,\n[Name] watches it float to the ground.",
        "base_photo": "l-leaf.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the leaf photo with the child in the white background. Match the pose of the child in the leaf photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "M for Moon",
        "script_text": "M is for Moon glowing up high,\n[Name] looks up at the nighttime sky.",
        "base_photo": "m-moon.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the moon photo with the child in the white background. Match the pose of the child in the moon photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "N for Nest",
        "script_text": "N is for Nest up in a tree,\n[Name] looks up quietly.",
        "base_photo": "n-nest.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the nest photo with the child in the white background. Match the pose of the child in the nest photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "O for Orange Cone",
        "script_text": "O is for Orange cone so bright,\n[Name] sees it marking a site.",
        "base_photo": "o-orange-cone.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the cone photo with the child in the white background. Match the pose of the child in the cone photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "P for Puddle",
        "script_text": "P is for puddle after rain,\n[Name] looks down and splashes again.",
        "base_photo": "p-puddle.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the puddle photo with the child in the white background. Match the pose of the child in the puddle photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "Q for Quilt",
        "script_text": "Q is for quilt laid out wide,\n[Name] sits softly by its side.",
        "base_photo": "q-quilt.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the quilt photo with the child in the white background. Match the pose of the child in the quilt photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "R for Road",
        "script_text": "R is for road stretching far,\n[Name] looks out from inside the car.",
        "base_photo": "r-road.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the car photo with the child in the white background. Match the pose of the child in the car photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb;

  -- Check if template already exists
  SELECT id INTO existing_template_id
  FROM story_templates
  WHERE title = 'Alphabet Adventures in the Neighborhood (J - R)'
  LIMIT 1;

  IF existing_template_id IS NOT NULL THEN
    -- Update existing template
    UPDATE story_templates
    SET
      description = 'Explore letters J through R in the neighborhood',
      category = 'letters',
      age_range = '2-6 years',
      scene_count = 9,
      cover_label = 'J-R',
      thumbnail_url = '/alphabet-general/cover-j-through-r.png',
      generation_model_id = nano_banana_pro_model_id,
      fixed_prompt_parts = '{}'::jsonb,
      script_data = template_data,
      is_active = true
    WHERE id = existing_template_id;
    RAISE NOTICE 'Updated existing "Alphabet Adventures in the Neighborhood (J - R)" story template (id: %)', existing_template_id;
  ELSE
    -- Insert new template
    INSERT INTO story_templates (
      title,
      description,
      category,
      age_range,
      scene_count,
      cover_label,
      thumbnail_url,
      generation_model_id,
      fixed_prompt_parts,
      script_data,
      is_active
    ) VALUES (
      'Alphabet Adventures in the Neighborhood (J - R)',
      'Explore letters J through R in the neighborhood',
      'letters',
      '2-6 years',
      9,
      'J-R',
      '/alphabet-general/cover-j-through-r.png',
      nano_banana_pro_model_id,
      '{}'::jsonb,
      template_data,
      true
    );
    RAISE NOTICE 'Inserted new "Alphabet Adventures in the Neighborhood (J - R)" story template';
  END IF;
END $$;
