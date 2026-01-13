-- Migration: 035_populate_mock_story_data.sql
-- Description: Populate mock_story_data for templates that have mock story images
-- Created: 2026-01-08
--
-- This populates mock_story_data with pre-generated scenes using images from mock_story folder.
-- The structure matches script_data.scenes but uses image_url instead of base_photo.

DO $$
DECLARE
  day_at_zoo_id INTEGER;
  counting_id INTEGER;
  alphabet_id INTEGER;
BEGIN
  -- Get template IDs
  SELECT id INTO day_at_zoo_id FROM story_templates WHERE title = 'Day at the Zoo' LIMIT 1;
  SELECT id INTO counting_id FROM story_templates WHERE title = 'Learning to Count (1 to 10)' LIMIT 1;
  SELECT id INTO alphabet_id FROM story_templates WHERE title = 'Alphabet Adventures in the Neighborhood (A - I)' LIMIT 1;

  -- Populate Day at the Zoo mock story data
  IF day_at_zoo_id IS NOT NULL THEN
    UPDATE story_templates
    SET mock_story_data = '{
      "character_name": "Alex",
      "scenes": [
        {
          "scene_number": 1,
          "headline": "The Grand Entrance",
          "script_text": "Alex stands tall by the colorful gate,\nA map in their hands—oh, what a great day!\n\nA bright animal hat, eyes open wide,\n\"So many adventures!\" Alex says with pride.",
          "text": "Alex stands tall by the colorful gate,\nA map in their hands—oh, what a great day!\n\nA bright animal hat, eyes open wide,\n\"So many adventures!\" Alex says with pride.",
          "image_url": "/mock_story/entrance.png"
        },
        {
          "scene_number": 2,
          "headline": "Monkey Business",
          "script_text": "Time for some monkey mischief and cheer,\nAlex laughs out loud as chimps swing near.\n\nThey copy the motions... jump, wiggle, and play,\nMonkey business brightens the day!",
          "text": "Time for some monkey mischief and cheer,\nAlex laughs out loud as chimps swing near.\n\nThey copy the motions... jump, wiggle, and play,\nMonkey business brightens the day!",
          "image_url": "/mock_story/monkeys.png"
        },
        {
          "scene_number": 3,
          "headline": "Feeding A Giraffe",
          "script_text": "Standing on the platform, Alex leans in,\nA giraffe stretches high with a curious grin.\n\nA long purple tongue grabs lettuce just right,\nAlex giggles with pure delight!",
          "text": "Standing on the platform, Alex leans in,\nA giraffe stretches high with a curious grin.\n\nA long purple tongue grabs lettuce just right,\nAlex giggles with pure delight!",
          "image_url": "/mock_story/giraffe.png"
        },
        {
          "scene_number": 4,
          "headline": "The Underwater Tunnel",
          "script_text": "Down in the tunnel, cool and blue,\nAlex looks up—what a wonderful view!\n\nA sea turtle glides, calm and slow,\nSwimming above in a gentle flow.",
          "text": "Down in the tunnel, cool and blue,\nAlex looks up—what a wonderful view!\n\nA sea turtle glides, calm and slow,\nSwimming above in a gentle flow.",
          "image_url": "/mock_story/aquarium.png"
        },
        {
          "scene_number": 5,
          "headline": "Lunch at the Plaza",
          "script_text": "At a picnic table, time for Alex to relax,\nJuice box in hand and bear-shaped snacks.\n\nA peacock struts by, feathers so grand,\nLunch tastes better with these birds at hand",
          "text": "At a picnic table, time for Alex to relax,\nJuice box in hand and bear-shaped snacks.\n\nA peacock struts by, feathers so grand,\nLunch tastes better with these birds at hand",
          "image_url": "/mock_story/lunch.png"
        },
        {
          "scene_number": 6,
          "headline": "Penguin Parade",
          "script_text": "Waddle, waddle—slide and splash!\nPenguins march by in a comical dash.\n\nAlex watches closely, smiles so wide,\nDiving into the water, chilly and blue inside.",
          "text": "Waddle, waddle—slide and splash!\nPenguins march by in a comical dash.\n\nAlex watches closely, smiles so wide,\nDiving into the water, chilly and blue inside.",
          "image_url": "/mock_story/penguins.png"
        },
        {
          "scene_number": 7,
          "headline": "The Petting Zoo",
          "script_text": "Cute little goat with fur so warm,\nAlex pets gently—slow and calm.\n\nWith grain in hand and eyes so bright,\nLearning to care feels just right.",
          "text": "Cute little goat with fur so warm,\nAlex pets gently—slow and calm.\n\nWith grain in hand and eyes so bright,\nLearning to care feels just right.",
          "image_url": "/mock_story/goats.png"
        },
        {
          "scene_number": 8,
          "headline": "The Butterfly Garden",
          "script_text": "In a green garden with colors so bright,\nAlex stands still—what a magical sight!\n\nButterflies flutter all dancing around,\nWings whisper softly without a sound.",
          "text": "In a green garden with colors so bright,\nAlex stands still—what a magical sight!\n\nButterflies flutter all dancing around,\nWings whisper softly without a sound.",
          "image_url": "/mock_story/butterflies.png"
        },
        {
          "scene_number": 9,
          "headline": "The Gift Shop",
          "script_text": "At the gift shop, it''s hard to choose,\nSo many treasures from the zoo!\n\nAlex hugs a soft penguin tight,\nA cuddly reminder of a day just right.",
          "text": "At the gift shop, it''s hard to choose,\nSo many treasures from the zoo!\n\nAlex hugs a soft penguin tight,\nA cuddly reminder of a day just right.",
          "image_url": "/mock_story/gift-shop.png"
        },
        {
          "scene_number": 10,
          "headline": "What a day",
          "script_text": "The sun dips low—it''s time to go,\nFeet feel tired but hearts still glow.\n\nWith ice cream in hand and a sleepy smile,\nAlex walks home dreaming all the while.",
          "text": "The sun dips low—it''s time to go,\nFeet feel tired but hearts still glow.\n\nWith ice cream in hand and a sleepy smile,\nAlex walks home dreaming all the while.",
          "image_url": "/mock_story/exit.png"
        }
      ]
    }'::jsonb
    WHERE id = day_at_zoo_id;
    
    RAISE NOTICE 'Populated mock_story_data for Day at the Zoo (id: %)', day_at_zoo_id;
  END IF;

  -- Populate Learning to Count mock story data
  IF counting_id IS NOT NULL THEN
    UPDATE story_templates
    SET mock_story_data = '{
      "character_name": "Alex",
      "scenes": [
        {
          "scene_number": 1,
          "headline": "One Hat",
          "script_text": "One cozy hat goes on just right,\nAlex puts it on and smiles bright.",
          "text": "One cozy hat goes on just right,\nAlex puts it on and smiles bright.",
          "image_url": "/mock_story/1-one.png"
        },
        {
          "scene_number": 2,
          "headline": "Two Shoes",
          "script_text": "Two little shoes—left and right,\nAlex puts them on, nice and tight!",
          "text": "Two little shoes—left and right,\nAlex puts them on, nice and tight!",
          "image_url": "/mock_story/2-two.png"
        },
        {
          "scene_number": 3,
          "headline": "Three Apples",
          "script_text": "Three red apples, shiny and round,\nAlex counts them where they''re found.",
          "text": "Three red apples, shiny and round,\nAlex counts them where they''re found.",
          "image_url": "/mock_story/3-three.png"
        },
        {
          "scene_number": 4,
          "headline": "Four Blocks",
          "script_text": "Four tall blocks stacked with care,\nUp they go—way up in the air!",
          "text": "Four tall blocks stacked with care,\nUp they go—way up in the air!",
          "image_url": "/mock_story/4-four.png"
        },
        {
          "scene_number": 5,
          "headline": "Five Fingers",
          "script_text": "Five fingers wiggle and wave,\nAlex says hello to everyone nice and brave!",
          "text": "Five fingers wiggle and wave,\nAlex says hello to everyone nice and brave!",
          "image_url": "/mock_story/5-five.png"
        },
        {
          "scene_number": 6,
          "headline": "Six Pairs of Socks",
          "script_text": "Six pairs of socks in colors so bright,\nAlex matches them up... left with right.",
          "text": "Six pairs of socks in colors so bright,\nAlex matches them up... left with right.",
          "image_url": "/mock_story/6-six.png"
        },
        {
          "scene_number": 7,
          "headline": "Seven Steps",
          "script_text": "Seven steps—climb, climb, climb!\nAlex counts each one in time.",
          "text": "Seven steps—climb, climb, climb!\nAlex counts each one in time.",
          "image_url": "/mock_story/7-seven.png"
        },
        {
          "scene_number": 8,
          "headline": "Eight Spoons",
          "script_text": "Eight shiny spoons laid out straight,\nAlex counts them all—one through eight!",
          "text": "Eight shiny spoons laid out straight,\nAlex counts them all—one through eight!",
          "image_url": "/mock_story/8-eight.png"
        },
        {
          "scene_number": 9,
          "headline": "Nine Picture Frames",
          "script_text": "Nine picture frames on the wall,\nAlex counts each one—big and small.",
          "text": "Nine picture frames on the wall,\nAlex counts each one—big and small.",
          "image_url": "/mock_story/9-nine.png"
        },
        {
          "scene_number": 10,
          "headline": "Ten Soft Pillows",
          "script_text": "Ten soft pillows cozy and bright,\nAlex snuggles in—sleep tight, sleep tight.",
          "text": "Ten soft pillows cozy and bright,\nAlex snuggles in—sleep tight, sleep tight.",
          "image_url": "/mock_story/10-ten.png"
        }
      ]
    }'::jsonb
    WHERE id = counting_id;
    
    RAISE NOTICE 'Populated mock_story_data for Learning to Count (id: %)', counting_id;
  END IF;

  -- Populate Alphabet Adventures mock story data
  IF alphabet_id IS NOT NULL THEN
    UPDATE story_templates
    SET mock_story_data = '{
      "character_name": "Alex",
      "scenes": [
        {
          "scene_number": 1,
          "headline": "A for Airplane",
          "script_text": "A is for airplane, up in the sky,\nA bright red plane goes rushing by.\nAlex looks up and watches it fly,\nA white cloud trail drifts way up high.",
          "text": "A is for airplane, up in the sky,\nA bright red plane goes rushing by.\nAlex looks up and watches it fly,\nA white cloud trail drifts way up high.",
          "image_url": "/mock_story/a-airplane.png"
        },
        {
          "scene_number": 2,
          "headline": "B for Bus",
          "script_text": "B is for bus so big and wide,\nAlex waves as it rolls by their side.\nThe doors slide open with a gentle sigh,\nA city moment passing by.",
          "text": "B is for bus so big and wide,\nAlex waves as it rolls by their side.\nThe doors slide open with a gentle sigh,\nA city moment passing by.",
          "image_url": "/mock_story/b-bus.png"
        },
        {
          "scene_number": 3,
          "headline": "C for Cloud",
          "script_text": "C is for cloud so fluffy and white,\nFloating slowly, light as light.\nAlex points and starts to say,\n\"That one looks like a shape today!\"",
          "text": "C is for cloud so fluffy and white,\nFloating slowly, light as light.\nAlex points and starts to say,\n\"That one looks like a shape today!\"",
          "image_url": "/mock_story/c-cloud.png"
        },
        {
          "scene_number": 4,
          "headline": "D for Dog",
          "script_text": "D is for dog on a walk nearby,\nTail goes wag as it trots right by.\nAlex smiles and says hello,\nThe dog trots on, nice and slow.",
          "text": "D is for dog on a walk nearby,\nTail goes wag as it trots right by.\nAlex smiles and says hello,\nThe dog trots on, nice and slow.",
          "image_url": "/mock_story/d-dog.png"
        },
        {
          "scene_number": 5,
          "headline": "E for Excavator",
          "script_text": "E is for excavator, loud and strong,\nDigging and scooping all day long.\nAlex watches with eyes so wide,\nAs dirt piles up on either side.",
          "text": "E is for excavator, loud and strong,\nDigging and scooping all day long.\nAlex watches with eyes so wide,\nAs dirt piles up on either side.",
          "image_url": "/mock_story/e-excavator.png"
        },
        {
          "scene_number": 6,
          "headline": "F for Fountain",
          "script_text": "F is for fountain splashing with cheer,\nWater jumps up, then disappears.\nAlex laughs as drops go high,\nSparkling in the sunny sky.",
          "text": "F is for fountain splashing with cheer,\nWater jumps up, then disappears.\nAlex laughs as drops go high,\nSparkling in the sunny sky.",
          "image_url": "/mock_story/f-fountain.png"
        },
        {
          "scene_number": 7,
          "headline": "G for Goose",
          "script_text": "G is for goose by the pond today,\nWaddling slowly on its way.\nAlex watches, quiet and still,\nAs it honks by the grassy hill.",
          "text": "G is for goose by the pond today,\nWaddling slowly on its way.\nAlex watches, quiet and still,\nAs it honks by the grassy hill.",
          "image_url": "/mock_story/g-goose.png"
        },
        {
          "scene_number": 8,
          "headline": "H for Helicopter",
          "script_text": "H is for helicopter up overhead,\nWhirring and humming as it''s led.\nAlex listens to the chopping sound,\nAs it circles slowly all around.",
          "text": "H is for helicopter up overhead,\nWhirring and humming as it''s led.\nAlex listens to the chopping sound,\nAs it circles slowly all around.",
          "image_url": "/mock_story/h-helicopter.png"
        },
        {
          "scene_number": 9,
          "headline": "I for Ice Cream",
          "script_text": "I is for ice cream, cold and sweet,\nMelting just a little in summer heat.\nAlex takes a lick—oh what fun,\nA tasty treat beneath the sun!",
          "text": "I is for ice cream, cold and sweet,\nMelting just a little in summer heat.\nAlex takes a lick—oh what fun,\nA tasty treat beneath the sun!",
          "image_url": "/mock_story/i-icecream.png"
        }
      ]
    }'::jsonb
    WHERE id = alphabet_id;
    
    RAISE NOTICE 'Populated mock_story_data for Alphabet Adventures A-I (id: %)', alphabet_id;
  END IF;

END $$;

