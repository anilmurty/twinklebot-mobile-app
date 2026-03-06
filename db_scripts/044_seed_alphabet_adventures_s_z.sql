-- Migration: 044_seed_alphabet_adventures_s_z.sql
-- Description: Seed "Alphabet Adventures in the Neighborhood (S - Z)" story template with 8 scenes
-- Created: 2026-03-05

DO $$
DECLARE
  nano_banana_pro_model_id INTEGER;
  existing_template_id INTEGER;
  template_data JSONB;
BEGIN
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
        "headline": "S for Sun",
        "script_text": "S is for sun shining so bright,\n[Name] squints and smiles in the light.",
        "base_photo": "s-sun.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the sun photo with the child in the white background. Match the pose of the child in the sun photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "T for Tree",
        "script_text": "T is for tree standing tall,\n[Name] looks up and sees it all.",
        "base_photo": "t-tree.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the tree photo with the child in the white background. Match the pose of the child in the tree photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "U for Umbrella",
        "script_text": "U is for umbrella open wide,\n[Name] stays dry with rain outside.",
        "base_photo": "u-umbrella.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the umbrella photo with the child in the white background. Match the pose of the child in the umbrella photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "V for Van",
        "script_text": "V is for van parked nearby,\n[Name] looks on as cars go by.",
        "base_photo": "v-van.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the van photo with the child in the white background. Match the pose of the child in the van photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "W for Windmill",
        "script_text": "W is for windmill spinning slow,\n[Name] watches blades turn to and fro.",
        "base_photo": "w-windmill.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the windmill photo with the child in the white background. Match the pose of the child in the windmill photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "X for Xylophone",
        "script_text": "X is for xylophone, tap-tap-tap,\n[Name] plays notes—tap, tap, tap!",
        "base_photo": "x-xylophone.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the xylophone photo with the child in the white background. Match the pose of the child in the xylophone photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "Y for Yard",
        "script_text": "Y is for yard with grass so green,\n[Name] stands where flowers are seen.",
        "base_photo": "y-yard.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the yard photo with the child in the white background. Match the pose of the child in the yard photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "Z for Zoo",
        "script_text": "Z is for zoo—what a day!\n[Name] looks around in wonder and play.",
        "base_photo": "z-zoo.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the zoo photo with the child in the white background. Match the pose of the child in the zoo photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb;

  -- Check if template already exists
  SELECT id INTO existing_template_id
  FROM story_templates
  WHERE title = 'Alphabet Adventures in the Neighborhood (S - Z)'
  LIMIT 1;

  IF existing_template_id IS NOT NULL THEN
    -- Update existing template
    UPDATE story_templates
    SET
      description = 'Explore letters S through Z in the neighborhood',
      category = 'letters',
      age_range = '2-6 years',
      scene_count = 8,
      cover_label = 'S-Z',
      thumbnail_url = '/alphabet-general/cover-s-through-z.png',
      generation_model_id = nano_banana_pro_model_id,
      fixed_prompt_parts = '{}'::jsonb,
      script_data = template_data,
      is_active = true
    WHERE id = existing_template_id;
    RAISE NOTICE 'Updated existing "Alphabet Adventures in the Neighborhood (S - Z)" story template (id: %)', existing_template_id;
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
      'Alphabet Adventures in the Neighborhood (S - Z)',
      'Explore letters S through Z in the neighborhood',
      'letters',
      '2-6 years',
      8,
      'S-Z',
      '/alphabet-general/cover-s-through-z.png',
      nano_banana_pro_model_id,
      '{}'::jsonb,
      template_data,
      true
    );
    RAISE NOTICE 'Inserted new "Alphabet Adventures in the Neighborhood (S - Z)" story template';
  END IF;
END $$;
