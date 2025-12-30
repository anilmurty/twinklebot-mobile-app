-- Migration: 013_seed_day_at_zoo.sql
-- Description: Seed "Day at the Zoo" story template with all 10 scenes
-- Created: 2024-01-01

-- Get nano-banana model ID (assumes it exists from migration 002)
DO $$
DECLARE
  nano_banana_model_id INTEGER;
  existing_template_id INTEGER;
  template_data JSONB;
BEGIN
  -- Get the nano-banana model ID
  SELECT id INTO nano_banana_model_id
  FROM generation_models
  WHERE name = 'nano-banana' AND is_active = true
  LIMIT 1;

  IF nano_banana_model_id IS NULL THEN
    RAISE EXCEPTION 'nano-banana model not found. Please run migration 002_seed_nano_banana_model.sql first.';
  END IF;

  -- Prepare template data
  template_data := '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "The Grand Entrance",
        "script_text": "[Name] stands wide-eyed at the colorful zoo gates, clutching a paper map and wearing a bright animal-themed sun hat. What a day it is going to be!",
        "base_photo": "entrance.jpeg",
        "child_photo": "front",
        "insertion_prompt": "put the child in the photo, clutching an open paper map with an expression of amazement and curiosity for what''s ahead. make height proportionate to surroundings and the child''s image should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "Monkey Business",
        "script_text": "Time for some monkey business. [Name] laughs and mimics the playful swinging motions of a family of chimpanzees.",
        "base_photo": "monkeys.jpeg",
        "child_photo": "right",
        "insertion_prompt": "put the child in the photo, excited and animated. The child''s image should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "Feeding A Giraffe",
        "script_text": "Standing on a high wooden platform, [Name] giggles as a giraffe stretches out its long, purple tongue to take a piece of lettuce.",
        "base_photo": "giraffe.jpeg",
        "child_photo": "left",
        "insertion_prompt": "put the child in the photo, securely behind the raised fence, feeding the giraffe lettuce, expression of excitement and amazement. The child''s image should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "The Underwater Tunnel",
        "script_text": "Inside the aquarium, [NAME] watched in amazement as a sea turtle glides silently overhead.",
        "base_photo": "aquarium.jpeg",
        "child_photo": "left",
        "insertion_prompt": "put the child into the photo. they should be standing under the giant turtle and looking up at it awestruck. The child''s image should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "Lunch at the Plaza",
        "script_text": "[Name] sits at a picnic table, enjoying a juice box and a sandwich shaped like a bear while watching a peacock strut by.",
        "base_photo": "lunch.jpeg",
        "child_photo": "right",
        "insertion_prompt": "put the child in the photo, sitting and sipping a juice box as if they''re posing for a photo. The child''s image should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "Penguin Parade",
        "script_text": "[Name] watches with delight as a group of penguins waddle across the ice and dive into the chilly blue water.",
        "base_photo": "penguins.jpeg",
        "child_photo": "right",
        "insertion_prompt": "put the child in the photo, facing the glass and viewing the penguins. The child''s image should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "The Petting Zoo",
        "script_text": "[Name] gently brushes the soft coat of a friendly pygmy goat while learning how to hold a handful of grain.",
        "base_photo": "goats.jpeg",
        "child_photo": "left",
        "insertion_prompt": "put the child in the photo, on their knees and gently petting the goat with their right hand while feeding the goat grains with their left hand. expression of quiet observation. The child''s image should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "The Butterfly Garden",
        "script_text": "In a quiet, tropical greenhouse, [NAME] stands perfectly still, as butterflies flutter around. What a magical place!",
        "base_photo": "butterflies.jpeg",
        "child_photo": "front",
        "insertion_prompt": "put the child in the photo, standing on the higher ground with their arm extended and their eyes gazing at he blue butterfly and their face turned towards it. The child''s facial expression that is hoping that the blue butterfly sits on it. The child''s image should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "The Gift Shop",
        "script_text": "At the gift shop [NAME] carefully chooses a soft plush penguin to remember their favorite animal from the trip.",
        "base_photo": "gift-shop.jpeg",
        "child_photo": "left",
        "insertion_prompt": "put the child in the photo, standing to the right of the penguin stand and examining the big penguin by pressing it with their hands. The child''s image should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "What a day!",
        "script_text": "After a long but fun day, it''s time to go home What will [Name] explore next?",
        "base_photo": "entrance.jpeg",
        "child_photo": "front",
        "insertion_prompt": "put the child in the photo, they should be walking out after a long day, tired but smiling and with an icecream in the child''s hand. The child''s image should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb;

  -- Check if template already exists
  SELECT id INTO existing_template_id
  FROM story_templates
  WHERE title = 'Day at the Zoo'
  LIMIT 1;

  IF existing_template_id IS NOT NULL THEN
    -- Update existing template
    UPDATE story_templates
    SET
      description = 'Join {character_name} on an exciting adventure through the zoo, meeting animals and having fun!',
      category = 'numbers',
      age_range = '1-5 years',
      scene_count = 10,
      cover_label = 'Day at the Zoo',
      thumbnail_url = '/day-at-the-zoo/cover.png',
      generation_model_id = nano_banana_model_id,
      fixed_prompt_parts = '{}'::jsonb,
      script_data = template_data,
      is_active = true
    WHERE id = existing_template_id;
    RAISE NOTICE 'Updated existing "Day at the Zoo" story template (id: %)', existing_template_id;
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
      'Day at the Zoo',
      'Join {character_name} on an exciting adventure through the zoo, meeting animals and having fun!',
      'numbers',
      '1-5 years',
      10,
      'Day at the Zoo',
      '/day-at-the-zoo/cover.png',
      nano_banana_model_id,
      '{}'::jsonb,
      template_data,
      true
    );
    RAISE NOTICE 'Inserted new "Day at the Zoo" story template';
  END IF;
END $$;

