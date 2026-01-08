-- Migration: 028_seed_counting_story.sql
-- Description: Delete old "Counting Adventure" and seed new "Learning to Count (1 to 10)" story template with all 10 scenes
-- Created: 2026-01-07

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

  -- Delete old "Counting Adventure" template if it exists
  DELETE FROM story_templates WHERE title = 'Counting Adventure';
  RAISE NOTICE 'Deleted old "Counting Adventure" template if it existed';

  -- Prepare template data
  template_data := '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "One Hat",
        "script_text": "One cozy hat goes on just right,\n[Name] puts it on and smiles bright.",
        "base_photo": "1-one.png",
        "child_photo": "front",
        "insertion_prompt": "put the child in the photo, putting on a hat while smiling and looking at themselves in the mirror. keep everything else the same",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "Two Shoes",
        "script_text": "Two little shoes—left and right,\n[Name] puts them on, nice and tight!",
        "base_photo": "2-two.png",
        "child_photo": "front",
        "insertion_prompt": "put the child in photo, sitting on the bench with left foot on the bench and trying to wear a shoe that pairs with the shoe that is on the floor. keep everything else the same",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "Three Apples",
        "script_text": "Three red apples, shiny and round,\n[Name] counts them where they''re found.",
        "base_photo": "3-three.png",
        "child_photo": "front",
        "insertion_prompt": "Add the child to the photo, standing on a chair, looking at the apples, pointing with one hand and gesturing with the other hand like counting the apples. keep everything else the same",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "Four Blocks",
        "script_text": "Four tall blocks stacked with care,\nUp they go—way up in the air!",
        "base_photo": "4-four.png",
        "child_photo": "front",
        "insertion_prompt": "put the child in the room sitting next to the stacked blocks and gesturing like they just stacked them. keep everything else the same",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "Five Fingers",
        "script_text": "Five fingers wiggle and wave,\n[Name] says hello to everyone nice and brave!",
        "base_photo": "5-five.png",
        "child_photo": "front",
        "insertion_prompt": "put the child in photo standing with left arm in the air and palm wide open so that all fingers are clearly visible. Right arm normally to their side. keep everything else the same",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "Six Pairs of Socks",
        "script_text": "Six pairs of socks in colors so bright,\n[Name] matches them up... left with right.",
        "base_photo": "6-six.png",
        "child_photo": "front",
        "insertion_prompt": "put the child in the photo, sitting on the bed, legs crossed, gesturing like they''re sorting the socks. keep everything else the same",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "Seven Steps",
        "script_text": "Seven steps—climb, climb, climb!\n[Name] counts each one in time.",
        "base_photo": "7-seven.png",
        "child_photo": "front",
        "insertion_prompt": "put the child in the photo, standing and looking up and gesturing like they''re counting the stairs. keep everything else the same",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "Eight Spoons",
        "script_text": "Eight shiny spoons laid out straight,\n[Name] counts them all—one through eight!",
        "base_photo": "8-eight.png",
        "child_photo": "front",
        "insertion_prompt": "put the child in the photo, sitting on the stool and counting the spoons. keep everything else the same",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "Nine Picture Frames",
        "script_text": "Nine picture frames on the wall,\n[Name] counts each one—big and small.",
        "base_photo": "9-nine.png",
        "child_photo": "front",
        "insertion_prompt": "put the child in the photo, standing and counting the picture frames. keep everything else the same",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "Ten Soft Pillows",
        "script_text": "Ten soft pillows cozy and bright,\n[Name] snuggles in—sleep tight, sleep tight.",
        "base_photo": "10-ten.png",
        "child_photo": "front",
        "insertion_prompt": "put the child in the photo, snuggled into the blanket but face visible. keep everything else the same",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb;

  -- Check if template already exists
  SELECT id INTO existing_template_id
  FROM story_templates
  WHERE title = 'Learning to Count (1 to 10)'
  LIMIT 1;

  IF existing_template_id IS NOT NULL THEN
    -- Update existing template
    UPDATE story_templates
    SET
      description = 'Watch {character_name} learn to count household items.',
      category = 'numbers',
      age_range = '1-5 years',
      scene_count = 10,
      cover_label = 'Learning to Count',
      thumbnail_url = '/counting-general/cover.png',
      generation_model_id = nano_banana_pro_model_id,
      fixed_prompt_parts = '{}'::jsonb,
      script_data = template_data,
      is_active = true
    WHERE id = existing_template_id;
    RAISE NOTICE 'Updated existing "Learning to Count (1 to 10)" story template (id: %)', existing_template_id;
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
      'Learning to Count (1 to 10)',
      'Watch {character_name} learn to count household items.',
      'numbers',
      '1-5 years',
      10,
      'Learning to Count',
      '/counting-general/cover.png',
      nano_banana_pro_model_id,
      '{}'::jsonb,
      template_data,
      true
    );
    RAISE NOTICE 'Inserted new "Learning to Count (1 to 10)" story template';
  END IF;
END $$;

