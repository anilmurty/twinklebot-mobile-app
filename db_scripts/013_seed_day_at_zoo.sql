-- Migration: 013_seed_day_at_zoo.sql
-- Description: Seed "Day at the Zoo" story template with all 10 scenes
-- Created: 2024-01-01

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
        "headline": "The Grand Entrance",
        "script_text": "[Name] stands tall by the colorful gate,\nA map in their hands—oh, what a great day!\n\nA bright animal hat, eyes open wide,\n\"So many adventures!\" [Name] says with pride.",
        "base_photo": "entrance.png",
        "child_photo": "front",
        "insertion_prompt": "put the child in the photo, clutching an open paper map with an expression of amazement and curiosity for what''s ahead. make height proportionate to surroundings and the child should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "Monkey Business",
        "script_text": "Time for some monkey mischief and cheer,\n[Name] laughs out loud as chimps swing near.\n\nThey copy the motions... jump, wiggle, and play,\nMonkey business brightens the day!",
        "base_photo": "monkeys.png",
        "child_photo": "right",
        "insertion_prompt": "put the child in the photo, excited and animated. The child should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "Feeding A Giraffe",
        "script_text": "Standing on the platform, [Name] leans in,\nA giraffe stretches high with a curious grin.\n\nA long purple tongue grabs lettuce just right,\n[Name] giggles with pure delight!",
        "base_photo": "giraffe.png",
        "child_photo": "left",
        "insertion_prompt": "put the child in the photo, standing on the platform and behind the fence, feeding the giraffe lettuce, expression of excitement and amazement. The child should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "The Underwater Tunnel",
        "script_text": "Down in the tunnel, cool and blue,\n[Name] looks up—what a wonderful view!\n\nA sea turtle glides, calm and slow,\nSwimming above in a gentle flow.",
        "base_photo": "aquarium.png",
        "child_photo": "right",
        "insertion_prompt": "put the child in the photo looking at the turtle and in amazement. make it look natural as if the photo was taken with the child in it. keep everything else the same and make it natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "Lunch at the Plaza",
        "script_text": "At a picnic table, time for [Name] to relax,\nJuice box in hand and bear-shaped snacks.\n\nA peacock struts by, feathers so grand,\nLunch tastes better with these birds at hand",
        "base_photo": "lunch.png",
        "child_photo": "right",
        "insertion_prompt": "put the child in the photo, sitting and sipping a juice box and holding a teddy bear shaped sandwich as if they''re posing for a photo. The child should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "Penguin Parade",
        "script_text": "Waddle, waddle—slide and splash!\nPenguins march by in a comical dash.\n\n[Name] watches closely, smiles so wide,\nDiving into the water, chilly and blue inside.",
        "base_photo": "penguins.png",
        "child_photo": "right",
        "insertion_prompt": "put the child in the photo sitting on the bench facing outward, sitting next to the backpack. keep everything else the same and make it look natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "The Petting Zoo",
        "script_text": "Cute little goat with fur so warm,\n[Name] pets gently—slow and calm.\n\nWith grain in hand and eyes so bright,\nLearning to care feels just right.",
        "base_photo": "goats.png",
        "child_photo": "left",
        "insertion_prompt": "put the child in the photo, on their knees and gently petting the goat with their right hand while feeding the goat grains with their left hand. expression of quiet observation. The child should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "The Butterfly Garden",
        "script_text": "In a green garden with colors so bright,\n[Name] stands still—what a magical sight!\n\nButterflies flutter all dancing around,\nWings whisper softly without a sound.",
        "base_photo": "butterflies.png",
        "child_photo": "front",
        "insertion_prompt": "put the child in the photo, standing firmly on the ground and amazed by all the butterflies around. make it look natural as if the photo was taken with the child in it",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "The Gift Shop",
        "script_text": "At the gift shop, it''s hard to choose,\nSo many treasures from the zoo!\n\n[Name] hugs a soft penguin tight,\nA cuddly reminder of a day just right.",
        "base_photo": "gift-shop.png",
        "child_photo": "left",
        "insertion_prompt": "add the child, hugging a penguin stuffed toy like the ones on the shelf affectionately with touching it with their face. keep evetyhing else the same make it look natunal as if the photo was taken with the child in it",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "What a day",
        "script_text": "The sun dips low—it''s time to go,\nFeet feel tired but hearts still glow.\n\nWith ice cream in hand and a sleepy smile,\n[Name] walks home dreaming all the while.",
        "base_photo": "exit.png",
        "child_photo": "front",
        "insertion_prompt": "put the child in the photo, they should be walking out after a long day, tired but smiling and with an icecream in the child''s hand. Keep everything else the same and make it look natural",
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
      description = 'Send {character_name} on an exciting adventure through the zoo, meeting animals and having fun!',
      category = 'numbers',
      age_range = '1-5 years',
      scene_count = 10,
      cover_label = 'Day at the Zoo',
      thumbnail_url = '/day-at-the-zoo/cover.png',
      generation_model_id = nano_banana_pro_model_id,
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
      nano_banana_pro_model_id,
      '{}'::jsonb,
      template_data,
      true
    );
    RAISE NOTICE 'Inserted new "Day at the Zoo" story template';
  END IF;
END $$;
