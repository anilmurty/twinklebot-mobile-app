-- Migration: 003_seed_story_templates.sql
-- Description: Seed the 4 initial story templates with prompts and scene data
-- Created: 2024-01-01

-- Get nano-banana model ID (assumes it exists from migration 002)
DO $$
DECLARE
  nano_banana_model_id INTEGER;
BEGIN
  -- Get the nano-banana model ID
  SELECT id INTO nano_banana_model_id
  FROM generation_models
  WHERE name = 'nano-banana' AND is_active = true
  LIMIT 1;

  IF nano_banana_model_id IS NULL THEN
    RAISE EXCEPTION 'nano-banana model not found. Please run migration 002_seed_nano_banana_model.sql first.';
  END IF;

  -- ============================================================================
  -- COUNTING ADVENTURE (10 scenes, numbers 1-10)
  -- ============================================================================
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
    'Counting Adventure',
    'Learn to count from 1 to 10 with fun adventures',
    'numbers',
    '2-5 years',
    10,
    '1-10',
    '/counting-numbers-colorful-illustration.jpg',
    nano_banana_model_id,
    '{
      "subject": "A vibrant 3D animated version of the person from image_input. The subject must have the same hair color, hair length, hair style, skin color, eye color, facial features, height, weight and joyful expression as the person in image_input. Do not squint the subject''s eyes.",
      "style": "Storybook aesthetic, 3D animation style (like Pixar), soft lighting. Ensure the subject''s face is clearly visible and is the hero of the image. The bottom 20% of the image should be less noisy for a text overlay. Any numbers (like two butterflies or five apples) should be strictly adhered to."
    }'::jsonb,
    '{
      "scenes": [
        {
          "scene_number": 1,
          "script_text": "1 On the way to school, {character_name} saw ONE red airplane in the sky!",
          "action": "The subject is walking to school on a sunny day, red backpack on their back, pointing up and amused by what they see. High in the sky is exactly 1 bright red airplane leaving a white trail.",
          "number": 1,
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 2,
          "script_text": "2 In the garden, {character_name} found TWO yellow butterflies dancing!",
          "action": "The subject is playing in green garden with flowers and other plants and with their house in the background. The subject is reaching out with their hands, trying to catch butterflies. Exactly 2 bright yellow butterflies are fluttering around the subject.",
          "number": 2,
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 3,
          "script_text": "3 Look ma, I got you 3 sunflowers! said {character_name}",
          "action": "The subject is in a flower field, flowers in the background and all around but blurred, blue skies with some patchy clouds. The subject is holding 3 sunflowers in their hand and smiling.",
          "number": 3,
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 4,
          "script_text": "4 Woo! {character_name} built a tower with FOUR colorful blocks.",
          "action": "The subject is sitting on a cozy rug in a playroom. There are other toys in the backround but blurred. A tower of exactly 4 wooden blocks (A, B, C, D) stacked in front of them. There are other alphabet blocks scattered around the subject and a an open play box that contains some of the blocks.",
          "number": 4,
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 5,
          "script_text": "5 Mmm, how yummy! {character_name} picked FIVE shiny red apples.",
          "action": "The subject is in a kitchen wearing a small white chef''s hat. Exactly 5 large, shiny red apples are sitting in a wooden bowl.",
          "number": 5,
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 6,
          "script_text": "6 When the sun went down, {character_name} saw SIX bright stars!",
          "action": "The subject is in a backyard at night, looking at the dark sky. Exactly 6 glowing stars are twinkling brightly above.",
          "number": 6,
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 7,
          "script_text": "7 {character_name} discovered SEVEN beautiful seashells in the sand.",
          "action": "The subject is at a beach, sitting near the gentle waves. Exactly 7 different colorful seashells are lined up in the sand.",
          "number": 7,
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 8,
          "script_text": "8 Deep in the woods, {character_name} and a squirrel found EIGHT acorns.",
          "action": "The subject is in a forest with tall, whimsical trees. Exactly 8 brown acorns are scattered on the ground near a squirrel.",
          "number": 8,
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 9,
          "script_text": "9 Happy Birthday! {character_name} is holding NINE giant balloons.",
          "action": "The subject is sitting by a park pond, waving at the water. Exactly 9 yellow rubber ducks are floating in a perfect line.",
          "number": 9,
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 10,
          "script_text": "10 {character_name} is sitting among TEN blooming flowers.",
          "action": "The subject is at a birthday party with a joyful expression and kids blurred in the bacakground giggling. 10 candles are on a cake, some blown, some flickering and rest solid. The subject has the expression of blowing the candles.",
          "number": 10,
          "aspect_ratio": "9:16"
        }
      ]
    }'::jsonb,
    true
  )
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- ALPHABET ADVENTURE 1 (9 scenes, A-I)
  -- ============================================================================
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
    'Alphabet Adventure 1',
    'Explore letters A through I with exciting stories',
    'letters',
    '3-6 years',
    9,
    'A-I',
    '/alphabet-letters-a-to-i-colorful.jpg',
    nano_banana_model_id,
    '{
      "subject": "A vibrant 3D cartoon version of the child from the reference images. The child must have the same hair color, hair length, hair style, skin color, eye color, facial features, height, weight and joyful expression as seen in the photos.",
      "style": "Whimsical storybook aesthetic, 3D animation style (like Pixar), soft lighting. Ensure the child''s face is clearly visible and the hero of the image. The bottom 20% of the image should be simple grass or sidewalk to allow for a text overlay."
    }'::jsonb,
    '{
      "scenes": [
        {
          "scene_number": 1,
          "script_text": "{character_name} saw three red APPLES on the table!",
          "action": "The child is in a kitchen reaching for a fruit bowl.",
          "detail": "Three large, shiny red APPLES are the focus on the table.",
          "letter": "A",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 2,
          "script_text": "Look at that! {character_name} found a big blue BALL.",
          "action": "The child is in a grassy backyard, looking down.",
          "detail": "A large, bright blue bouncy BALL is at their feet.",
          "letter": "B",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 3,
          "script_text": "{character_name} met a very soft, fluffy CAT on the porch.",
          "action": "The child is sitting on a wooden porch, smiling.",
          "detail": "A friendly, fluffy orange cartoon CAT sits beside them.",
          "letter": "C",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 4,
          "script_text": "Splash! {character_name} is watching a happy DUCK.",
          "action": "The child is at a park pond, leaning toward the water.",
          "detail": "One cheerful yellow DUCK is splashing in the pond.",
          "letter": "D",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 5,
          "script_text": "{character_name} saw a giant, gray ELEPHANT!",
          "action": "The child is at a zoo enclosure, waving.",
          "detail": "A friendly, cartoon ELEPHANT is waving its trunk back.",
          "letter": "E",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 6,
          "script_text": "One, two! {character_name} found a green FROG.",
          "action": "The child is crouching by a lily pond, looking closely.",
          "detail": "A small green FROG is sitting on a large lily pad.",
          "letter": "F",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 7,
          "script_text": "{character_name} is helping water the GARDEN flowers.",
          "action": "The child is holding a small, colorful watering can.",
          "detail": "A row of bright, blooming GARDEN flowers is being watered.",
          "letter": "G",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 8,
          "script_text": "{character_name} is wearing a very silly yellow HAT!",
          "action": "The child is looking into a mirror, laughing.",
          "detail": "An oversized, funny yellow sun HAT is on their head.",
          "letter": "H",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 9,
          "script_text": "Brrr! {character_name} is eating a cold, sweet ICE CREAM.",
          "action": "The child is holding a large waffle cone.",
          "detail": "A massive scoop of pink ICE CREAM is on the cone.",
          "letter": "I",
          "aspect_ratio": "9:16"
        }
      ]
    }'::jsonb,
    true
  )
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- ALPHABET ADVENTURE 2 (9 scenes, J-R)
  -- ============================================================================
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
    'Alphabet Adventure 2',
    'Discover letters J through R in amazing scenes',
    'letters',
    '3-6 years',
    9,
    'J-R',
    '/alphabet-letters-j-to-r-educational.jpg',
    nano_banana_model_id,
    '{
      "subject": "A vibrant 3D cartoon version of the child from the reference images. The child must have the same hair color, hair length, hair style, skin color, eye color, facial features, height, weight and joyful expression as seen in the photos.",
      "style": "Whimsical storybook aesthetic, 3D animation style (like Pixar), soft lighting. Ensure the child''s face is clearly visible and the hero of the image. The bottom 20% of the image should be simple grass or sidewalk to allow for a text overlay."
    }'::jsonb,
    '{
      "scenes": [
        {
          "scene_number": 1,
          "script_text": "{character_name} put on a warm JACKET to go outside.",
          "action": "The child is standing by a front door, ready to leave.",
          "detail": "They are zipping up a bright red winter JACKET.",
          "letter": "J",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 2,
          "script_text": "High in the sky, {character_name} is flying a KITE.",
          "action": "The child is running through a windy meadow.",
          "detail": "A colorful diamond-shaped KITE is soaring high above.",
          "letter": "K",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 3,
          "script_text": "{character_name} found a tiny LADYBUG on a leaf.",
          "action": "The child is holding a green leaf close to their face.",
          "detail": "A tiny red LADYBUG with black spots is on the leaf.",
          "letter": "L",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 4,
          "script_text": "{character_name} is looking at the big, white MOON.",
          "action": "The child is looking out of a bedroom window at night.",
          "detail": "A large, glowing crescent MOON is in the starry sky.",
          "letter": "M",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 5,
          "script_text": "{character_name} found a bird''s NEST high in a tree.",
          "action": "The child is pointing upward at a tree branch.",
          "detail": "A small NEST with three blue eggs is tucked in the tree.",
          "letter": "N",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 6,
          "script_text": "{character_name} is peeling a round, orange ORANGE.",
          "action": "The child is sitting at a wooden table.",
          "detail": "A bright, round ORANGE is partially peeled in their hands.",
          "letter": "O",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 7,
          "script_text": "{character_name} is playing with a cute, spotted PUPPY.",
          "action": "The child is sitting on the grass, playing.",
          "detail": "A playful Dalmatian PUPPY is jumping toward them.",
          "letter": "P",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 8,
          "script_text": "Shhh! {character_name} is being very QUIET.",
          "action": "The child is holding a finger to their lips.",
          "detail": "A cozy room with a sleeping teddy bear nearby.",
          "letter": "Q",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 9,
          "script_text": "After the rain, {character_name} saw a RAINBOW.",
          "action": "The child is standing in a small puddle, looking up.",
          "detail": "A bright, multi-colored RAINBOW spans across the sky.",
          "letter": "R",
          "aspect_ratio": "9:16"
        }
      ]
    }'::jsonb,
    true
  )
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- ALPHABET ADVENTURE 3 (8 scenes, S-Z)
  -- ============================================================================
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
    'Alphabet Adventure 3',
    'Complete the alphabet with letters S through Z',
    'letters',
    '3-6 years',
    8,
    'S-Z',
    '/alphabet-letters-s-to-z-learning.jpg',
    nano_banana_model_id,
    '{
      "subject": "A vibrant 3D cartoon version of the child from the reference images. The child must have the same hair color, hair length, hair style, skin color, eye color, facial features, height, weight and joyful expression as seen in the photos.",
      "style": "Whimsical storybook aesthetic, 3D animation style (like Pixar), soft lighting. Ensure the child''s face is clearly visible and the hero of the image. The bottom 20% of the image should be simple grass or sidewalk to allow for a text overlay."
    }'::jsonb,
    '{
      "scenes": [
        {
          "scene_number": 1,
          "script_text": "{character_name} is building a tall SANDCASTLE.",
          "action": "The child is playing with a shovel and bucket on a beach.",
          "detail": "A detailed SANDCASTLE with a small flag is in front of them.",
          "letter": "S",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 2,
          "script_text": "Choo-choo! {character_name} is playing with a toy TRAIN.",
          "action": "The child is on the floor, pushing a toy.",
          "detail": "A red wooden toy TRAIN is on a wooden track.",
          "letter": "T",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 3,
          "script_text": "{character_name} stayed dry under a purple UMBRELLA.",
          "action": "The child is walking in a gentle, light rain.",
          "detail": "They are holding a large, bright purple UMBRELLA.",
          "letter": "U",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 4,
          "script_text": "{character_name} put fresh flowers into a glass VASE.",
          "action": "The child is standing at a kitchen counter.",
          "detail": "A clear glass VASE is filled with bright sunflowers.",
          "letter": "V",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 5,
          "script_text": "{character_name} saw a big WHALE splash in the ocean!",
          "action": "The child is standing on the deck of a small boat.",
          "detail": "A large blue WHALE tail is splashing out of the water.",
          "letter": "W",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 6,
          "script_text": "{character_name} is playing a song on the XYLOPHONE.",
          "action": "The child is holding two small mallets.",
          "detail": "A rainbow-colored toy XYLOPHONE is on their lap.",
          "letter": "X",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 7,
          "script_text": "Up and down! {character_name} is playing with a YO-YO.",
          "action": "The child is standing with one arm extended.",
          "detail": "A classic red YO-YO is spinning at the end of a string.",
          "letter": "Y",
          "aspect_ratio": "9:16"
        },
        {
          "scene_number": 8,
          "script_text": "{character_name} saw a striped ZEBRA at the zoo.",
          "action": "The child is looking through a zoo fence.",
          "detail": "A black-and-white striped ZEBRA is in the background.",
          "letter": "Z",
          "aspect_ratio": "9:16"
        }
      ]
    }'::jsonb,
    true
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Successfully seeded 4 story templates';
END $$;
