-- Migration: 053_seed_fire_station_and_farmers_market.sql
-- Description: Seed "Field Trip To The Fire Station" (world knowledge) and
--              "Visit To The Farmer's Market" (math learning) story templates
-- Created: 2026-03-06

-- Add 'world' and 'math' to the allowed category values
ALTER TABLE story_templates DROP CONSTRAINT IF EXISTS story_templates_category_check;
ALTER TABLE story_templates ADD CONSTRAINT story_templates_category_check
  CHECK (category IN ('numbers', 'letters', 'scifi', 'world', 'math'));

-- ============================================================
-- 1. Field Trip To The Fire Station (World Knowledge)
-- ============================================================

DO $$
DECLARE
  nano_banana_pro_model_id INTEGER;
  existing_template_id INTEGER;
  template_data JSONB;
BEGIN
  SELECT id INTO nano_banana_pro_model_id
  FROM generation_models
  WHERE name = 'nano-banana-pro' AND is_active = true
  LIMIT 1;

  IF nano_banana_pro_model_id IS NULL THEN
    RAISE EXCEPTION 'nano-banana-pro model not found. Please run migration 017_add_nano_banana_pro_model.sql first.';
  END IF;

  template_data := '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "The Big Red Doors",
        "script_text": "[Name] arrives at the fire station on a sunny morning and stops to stare. Two enormous red doors stand wide open, and right inside — a shiny red fire truck!\n\n\"Whoa,\" says [Name], eyes wide. \"It''s even bigger than I imagined.\"\n\nA friendly firefighter in a navy uniform waves from the entrance. \"Welcome! Ready for a tour?\"",
        "base_photo": "1-bit-red-doors.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the fire station exterior photo with the child in the white background. Match the pose of the child in the exterior photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "The Gear Wall",
        "script_text": "Inside the station, [Name] sees a whole wall of firefighter gear — helmets, jackets, boots, and oxygen tanks, each set hanging on its own hook, ready to go.\n\n\"Firefighters have to get dressed in under 60 seconds,\" the firefighter explains. \"Every second counts when someone needs help.\"\n\n[Name] looks at all the gear and thinks — that''s a lot to put on very fast!",
        "base_photo": "2-the-gear-wall.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the gear wall photo with the child in the white background. Match the pose of the child in the gear wall photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "The Fire Truck Up Close",
        "script_text": "The fire truck is enormous up close. [Name] walks all the way around it, counting the compartments along the side — each one holds a different tool for fighting fires.\n\nThe firefighter opens one door to show a neatly coiled hose. \"Each hose can stretch the whole length of this street,\" she says.\n\n\"How much water does it carry?\" asks [Name]. \"Enough to fill a thousand bathtubs!\"",
        "base_photo": "3-fire-truck-upclose.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the fire truck photo with the child in the white background. Match the pose of the child standing beside the fire truck. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "Trying on the Gear",
        "script_text": "\"Would you like to try some on?\" the firefighter asks with a smile.\n\n[Name] puts on a bright yellow helmet — it wobbles a little because it''s so big. Then comes the heavy turnout jacket, which hangs down past [Name]''s knees. Finally, the big rubber boots!\n\n\"You look like a real firefighter,\" laughs the firefighter. [Name] stands as tall as possible and grins.",
        "base_photo": "4-trying-on-gear.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the gear try-on photo with the child in the white background. Match the pose and firefighter gear of the child in the try-on photo. make it look like it was taken with the child from the white background photo. the child must be wearing the full oversized firefighter gear",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "Up in the Truck",
        "script_text": "The firefighter lifts [Name] up into the cab of the fire truck — the driver''s seat! [Name] looks out through the giant windshield and sees the whole fire station from above.\n\nThere are so many buttons and switches on the dashboard. \"Each one does something important,\" explains the firefighter. \"This one controls the siren, and this one turns on the lights.\"\n\n[Name] grips the big steering wheel with both hands. \"I could drive this!\"",
        "base_photo": "5-up-in-the-truck.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the fire truck cab photo with the child in the white background. Match the pose of the child sitting in the fire truck cab. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "The Brass Pole",
        "script_text": "Upstairs, firefighters have a bunk room where they sleep during long shifts. And in the corner — the famous brass pole!\n\n\"When the alarm rings at night, there''s no time to use the stairs,\" says the firefighter. \"We grab the pole and slide down in one second — and we''re ready to go.\"\n\n[Name] wraps both arms around the shiny pole and slides down slowly. \"That''s the best way to wake up,\" [Name] declares.",
        "base_photo": "6-the-brass-pole.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the pole photo with the child in the white background. Match the pose of the child holding the brass pole. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "The Alarm Goes Off!",
        "script_text": "BRRRING! BRRRING! Suddenly a loud alarm fills the whole station!\n\nRed lights flash along the ceiling. The firefighters sprint to the gear wall and start pulling on their jackets and helmets — so fast it looks like a blur.\n\n[Name] watches with wide eyes as the crew jumps into the truck. The big red doors roll open, the siren wails, and — WHOOSH — the truck is gone.\n\n\"That''s what we train for every single day,\" says one firefighter who stayed behind, catching her breath.",
        "base_photo": "7-alarm-goes-off.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the alarm scene photo with the child in the white background. Match the pose of the child watching the alarm scene. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "Stop, Drop, and Roll",
        "script_text": "Back inside, the firefighter has an important lesson. \"What would you do if your clothes ever caught fire?\" she asks seriously.\n\n[Name] listens very carefully. Stop — don''t run. Drop — get down to the ground right away. Roll — roll back and forth to put the fire out.\n\nStop. Drop. Roll. [Name] practices on the clean mat until it feels natural. \"That could save your life one day,\" says the firefighter quietly.",
        "base_photo": "8-stop-drop-roll.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the stop drop roll photo with the child in the white background. Match the pose of the child practicing stop drop roll. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "The Fire Safety House",
        "script_text": "In the yard behind the station there''s a small model house used for fire safety training. The firefighter walks [Name] through what to do if there''s ever a fire at home.\n\n\"Always feel a door before you open it,\" she explains. \"If it''s hot, don''t open it — use another way out.\" She shows [Name] two escape routes from the model bedroom — the door and the window.\n\n\"Every family should have a plan,\" she says. \"Now you can help make yours.\"",
        "base_photo": "9-fire-safety-house.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the training house photo with the child in the white background. Match the pose of the child in front of the training house. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "Junior Firefighter",
        "script_text": "Before [Name] leaves, the firefighter kneels down with a big smile and pins something to [Name]''s shirt — a shiny gold Junior Firefighter badge!\n\n\"You asked great questions today,\" she says. \"You''ve learned how firefighters dress, what tools they use, and how to stay safe. That makes you an honorary member of Station 7.\"\n\n[Name] looks down at the gleaming badge and stands up very straight.\n\n\"I''m going to be a real firefighter one day,\" [Name] announces.",
        "base_photo": "10-junior-firefighter.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the badge ceremony photo with the child in the white background. Match the pose of the child receiving the badge. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb;

  SELECT id INTO existing_template_id
  FROM story_templates
  WHERE title = 'Field Trip To The Fire Station'
  LIMIT 1;

  IF existing_template_id IS NOT NULL THEN
    UPDATE story_templates
    SET
      description = 'Visit a real fire station and learn about firefighters, their gear, and how to stay safe!',
      category = 'world',
      age_range = '2-6 years',
      scene_count = 10,
      cover_label = '',
      thumbnail_url = '/field-trip-to-the-fire-station/cover.png',
      generation_model_id = nano_banana_pro_model_id,
      fixed_prompt_parts = '{}'::jsonb,
      script_data = template_data,
      is_active = true
    WHERE id = existing_template_id;
    RAISE NOTICE 'Updated existing "Field Trip To The Fire Station" story template (id: %)', existing_template_id;
  ELSE
    INSERT INTO story_templates (
      title, description, category, age_range, scene_count, cover_label,
      thumbnail_url, generation_model_id, fixed_prompt_parts, script_data, is_active
    ) VALUES (
      'Field Trip To The Fire Station',
      'Visit a real fire station and learn about firefighters, their gear, and how to stay safe!',
      'world',
      '2-6 years',
      10,
      '',
      '/field-trip-to-the-fire-station/cover.png',
      nano_banana_pro_model_id,
      '{}'::jsonb,
      template_data,
      true
    );
    RAISE NOTICE 'Inserted new "Field Trip To The Fire Station" story template';
  END IF;
END $$;

-- ============================================================
-- 2. Visit To The Farmer's Market (Math Learning)
-- ============================================================

DO $$
DECLARE
  nano_banana_pro_model_id INTEGER;
  existing_template_id INTEGER;
  template_data JSONB;
BEGIN
  SELECT id INTO nano_banana_pro_model_id
  FROM generation_models
  WHERE name = 'nano-banana-pro' AND is_active = true
  LIMIT 1;

  IF nano_banana_pro_model_id IS NULL THEN
    RAISE EXCEPTION 'nano-banana-pro model not found.';
  END IF;

  template_data := '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "Entering the Market",
        "script_text": "[Name] arrives at the busy farmer''s market on a bright sunny morning. There are colorful stalls as far as the eye can see! [Name] counts ten tents stretching down the path and wonders what treasures are waiting inside each one.\n\n\"One, two, three…\" [Name] counts out loud. \"Ten stalls — let''s explore them all!\"",
        "base_photo": "1-entering-the-market.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the market entrance photo with the child in the white background. Match the pose of the child in the market entrance photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "The Apple Mountain",
        "script_text": "The first stall has a huge pile of shiny red apples! The friendly farmer asks [Name] to count them into groups of five.\n\n\"Five here, and five more there — that makes ten altogether!\" [Name] says proudly, carefully stacking the apples into two neat groups.",
        "base_photo": "2-the-apple-mountain.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the apple stall photo with the child in the white background. Match the pose of the child at the apple stall. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "More or Fewer?",
        "script_text": "At the vegetable stall, [Name] sees a basket of 8 carrots and a basket of 5 zucchinis sitting side by side.\n\n\"Which basket has more?\" asks the farmer. [Name] counts each one carefully, pointing to every vegetable. \"Eight carrots — that''s more than five zucchinis!\"",
        "base_photo": "3-more-or-fewer.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the vegetable stall photo with the child in the white background. Match the pose of the child at the vegetable stall. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "The Great Pepper Sort",
        "script_text": "A big mixed basket of peppers needs sorting before customers arrive — red ones, yellow ones, and green ones all jumbled together!\n\n[Name] picks up each pepper one by one and places it carefully in the right bin. Sorting by color makes everything neat — and much easier to count!",
        "base_photo": "4-the-great-pepper-sort.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the pepper sorting photo with the child in the white background. Match the pose of the child sorting peppers. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "The Coin Purse",
        "script_text": "[Name] has a little coin purse with 5 shiny coins inside. A small bunch of fresh carrots costs 3 coins. [Name] counts out three coins carefully — one, two, three — and places them on the wooden table.\n\n\"Now how many coins do I have left?\" [Name] peeks into the purse to count.",
        "base_photo": "5-the-coin-purse.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the market purchase photo with the child in the white background. Match the pose of the child at the market purchase. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "Strawberry Pairs",
        "script_text": "One farmer sells strawberries in pairs — always two in every little cup. [Name] helps fill an empty tray, carefully placing two plump strawberries into each cup.\n\nTwo, four, six, eight, ten! Skip-counting by twos, [Name] fills the whole tray without missing a single cup.",
        "base_photo": "6-strawberry-pairs.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the berry stall photo with the child in the white background. Match the pose of the child filling the strawberry tray. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "How Many Are Left?",
        "script_text": "The bread baker started the day with 10 golden loaves on the rack. [Name] watches as customers arrive — three loaves sell quickly, then two more are taken.\n\n\"Ten take away six — how many loaves are left?\" [Name] counts the remaining loaves on the rack. \"Four! There are Four loaves left!\"",
        "base_photo": "7-how-many-are-left.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the bread stall photo with the child in the white background. Match the pose of the child at the bread stall. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "Heavy or Light?",
        "script_text": "The pumpkin stall has an old-fashioned balance scale. [Name] places a small apple on one side — then a big round pumpkin on the other. The pumpkin side crashes down!\n\nNext, [Name] tries two apples against one large pear. The scale tips slowly. \"The two apples are heavier than the one pear!\"",
        "base_photo": "8-heavy-or-light.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the scale photo with the child in the white background. Match the pose of the child at the balance scale. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "The Tomato Pattern",
        "script_text": "One farmer has arranged heirloom tomatoes in a beautiful pattern along the table — red, yellow, red, yellow, all in a row. But there''s a gap at the end!\n\n\"What comes next?\" the farmer asks [Name] with a wink. [Name] studies the pattern carefully, then picks up the right tomato and places it in the gap. \"Red! It has to be red!\"",
        "base_photo": "9-the-tomato-pattern.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the tomato stall photo with the child in the white background. Match the pose of the child at the tomato stall. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "A Full Basket!",
        "script_text": "At the end of a wonderful morning, [Name]''s basket is full of colorful treasures — 3 shiny apples, 4 bright carrots, and 2 ripe tomatoes.\n\nThe friendly farmer helps add it all up. \"Three plus four is seven — and two more makes nine! Nine things in all. You did a great job at the market today, [Name]!\"",
        "base_photo": "10-a-full-basket.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the market end photo with the child in the white background. Match the pose of the child with the full basket. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb;

  SELECT id INTO existing_template_id
  FROM story_templates
  WHERE title = 'Visit To The Farmer''s Market'
  LIMIT 1;

  IF existing_template_id IS NOT NULL THEN
    UPDATE story_templates
    SET
      description = 'Explore a colorful farmer''s market and practice counting, sorting, patterns, and more!',
      category = 'math',
      age_range = '2-6 years',
      scene_count = 10,
      cover_label = '',
      thumbnail_url = '/visit-to-the-farmers-market/cover.png',
      generation_model_id = nano_banana_pro_model_id,
      fixed_prompt_parts = '{}'::jsonb,
      script_data = template_data,
      is_active = true
    WHERE id = existing_template_id;
    RAISE NOTICE 'Updated existing "Visit To The Farmer''s Market" story template (id: %)', existing_template_id;
  ELSE
    INSERT INTO story_templates (
      title, description, category, age_range, scene_count, cover_label,
      thumbnail_url, generation_model_id, fixed_prompt_parts, script_data, is_active
    ) VALUES (
      'Visit To The Farmer''s Market',
      'Explore a colorful farmer''s market and practice counting, sorting, patterns, and more!',
      'math',
      '2-6 years',
      10,
      '',
      '/visit-to-the-farmers-market/cover.png',
      nano_banana_pro_model_id,
      '{}'::jsonb,
      template_data,
      true
    );
    RAISE NOTICE 'Inserted new "Visit To The Farmer''s Market" story template';
  END IF;
END $$;
