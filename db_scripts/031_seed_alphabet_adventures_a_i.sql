-- Migration: 031_seed_alphabet_adventures_a_i.sql
-- Description: Seed "Alphabet Adventures in the Neighborhood (A - I)" story template with 9 scenes
-- Created: 2026-01-08

-- Get nano-banana-pro model ID (assumes it exists from migration 017)
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
        "headline": "A for Airplane",
        "script_text": "A is for airplane, up in the sky,\nA bright red plane goes rushing by.\n[Name] looks up and watches it fly,\nA white cloud trail drifts way up high.",
        "base_photo": "a-airplane.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the airplane photo with the child in the white background. Match the pose of the child in the airplane photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "B for Bus",
        "script_text": "B is for bus so big and wide,\n[Name] waves as it rolls by their side.\nThe doors slide open with a gentle sigh,\nA city moment passing by.",
        "base_photo": "b-bus.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the bus photo with the child in the white background. Match the pose of the child in the bus photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "C for Cloud",
        "script_text": "C is for cloud so fluffy and white,\nFloating slowly, light as light.\n[Name] points and starts to say,\n\"That one looks like a shape today!\"",
        "base_photo": "c-cloud.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the cloud photo with the child in the white background. Match the pose of the child in the cloud photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "D for Dog",
        "script_text": "D is for dog on a walk nearby,\nTail goes wag as it trots right by.\n[Name] smiles and says hello,\nThe dog trots on, nice and slow.",
        "base_photo": "d-dog.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the dog photo with the child in the white background. Match the pose of the child in the dog photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "E for Excavator",
        "script_text": "E is for excavator, loud and strong,\nDigging and scooping all day long.\n[Name] watches with eyes so wide,\nAs dirt piles up on either side.",
        "base_photo": "e-excavator.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the excavator photo with the child in the white background. Match the pose of the child in the excavator photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "F for Fountain",
        "script_text": "F is for fountain splashing with cheer,\nWater jumps up, then disappears.\n[Name] laughs as drops go high,\nSparkling in the sunny sky.",
        "base_photo": "f-fountain.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the fountain photo with the child in the white background. Match the pose of the child in the fountain photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "G for Goose",
        "script_text": "G is for goose by the pond today,\nWaddling slowly on its way.\n[Name] watches, quiet and still,\nAs it honks by the grassy hill.",
        "base_photo": "g-goose.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the goose photo with the child in the white background. Match the pose of the child in the goose photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "H for Helicopter",
        "script_text": "H is for helicopter up overhead,\nWhirring and humming as it''s led.\n[Name] listens to the chopping sound,\nAs it circles slowly all around.",
        "base_photo": "h-helicopter.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the helicopter photo with the child in the white background. Match the pose of the child in the helicopter photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "I for Ice Cream",
        "script_text": "I is for ice cream, cold and sweet,\nMelting just a little in summer heat.\n[Name] takes a lick—oh what fun,\nA tasty treat beneath the sun!",
        "base_photo": "i-icecream.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the icecream photo with the child in the white background. match the pose of the child in the icecream photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb;

  -- Check if template already exists
  SELECT id INTO existing_template_id
  FROM story_templates
  WHERE title = 'Alphabet Adventures in the Neighborhood (A - I)'
  LIMIT 1;

  IF existing_template_id IS NOT NULL THEN
    -- Update existing template
    UPDATE story_templates
    SET
      description = 'Explore letters A through I in the neighborhood',
      category = 'letters',
      age_range = '2-6 years',
      scene_count = 9,
      cover_label = 'A-I',
      thumbnail_url = '/alphabet-general/cover.png',
      generation_model_id = nano_banana_pro_model_id,
      fixed_prompt_parts = '{}'::jsonb,
      script_data = template_data,
      is_active = true
    WHERE id = existing_template_id;
    RAISE NOTICE 'Updated existing "Alphabet Adventures in the Neighborhood (A - I)" story template (id: %)', existing_template_id;
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
      'Alphabet Adventures in the Neighborhood (A - I)',
      'Explore letters A through I in the neighborhood',
      'letters',
      '2-6 years',
      9,
      'A-I',
      '/alphabet-general/cover.png',
      nano_banana_pro_model_id,
      '{}'::jsonb,
      template_data,
      true
    );
    RAISE NOTICE 'Inserted new "Alphabet Adventures in the Neighborhood (A - I)" story template';
  END IF;
END $$;

