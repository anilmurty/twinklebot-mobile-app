-- Migration: 055_seed_coming_soon_templates.sql
-- Description: Seed 46 coming-soon story templates across 5 categories
--   These have cover images but no script_data (shown as "coming soon")
-- Created: 2026-03-07

-- Add 'science' to category constraint
ALTER TABLE story_templates DROP CONSTRAINT IF EXISTS story_templates_category_check;
ALTER TABLE story_templates ADD CONSTRAINT story_templates_category_check
  CHECK (category IN ('numbers', 'letters', 'scifi', 'world', 'math', 'language', 'science'));

DO $$
DECLARE
  nano_banana_pro_model_id INTEGER;
BEGIN
  SELECT id INTO nano_banana_pro_model_id
  FROM generation_models
  WHERE name = 'nano-banana-pro' AND is_active = true
  LIMIT 1;

  IF nano_banana_pro_model_id IS NULL THEN
    RAISE EXCEPTION 'nano-banana-pro model not found.';
  END IF;

  -- ============================================================
  -- MATH LEARNING (9 new templates)
  -- ============================================================

  INSERT INTO story_templates (title, description, category, age_range, scene_count, cover_label, thumbnail_url, generation_model_id, fixed_prompt_parts, script_data, is_active)
  VALUES
    ('The Great Bake Sale', 'Bake and sell cookies while learning to count ingredients, trays, and coins earned!', 'math', '2-6 years', 10, '', '/the-great-bake-sale/the-great-bake-sale.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Building a Birdhouse', 'Measure, cut, and count pieces of wood with a friendly owl to build the perfect birdhouse!', 'math', '2-6 years', 10, '', '/building-a-birdhouse/building-a-birdhouse.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Camping Under the Stars', 'Count stars, tent pegs, s''mores, and fireflies while setting up camp!', 'math', '2-6 years', 10, '', '/camping-under-the-stars/camping-under-the-stars.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Toy Store Sort', 'Help a quirky toy shop owner organize shelves by color, count toys, and solve puzzles!', 'math', '2-6 years', 10, '', '/the-toy-store-sort/the-toy-store-sort.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Race Day at the Track', 'Watch and race go-karts while counting laps, positions, and finishing times!', 'math', '2-6 years', 10, '', '/race-day-at-the-track/race-day-at-the-track.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Garden Grows', 'Plant seeds, count days, measure plant height, and harvest vegetables!', 'math', '2-6 years', 10, '', '/the-garden-grows/the-garden-grows.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Pizza Party Problem', 'Host a pizza party and figure out slices, equal sharing, and toppings per piece!', 'math', '2-6 years', 10, '', '/the-pizza-party-problem/the-pizza-party-problem.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Aquarium Helper', 'Help a marine biologist count fish, track feeding schedules, and sort sea creatures!', 'math', '2-6 years', 10, '', '/the-acquarium-helper/the-acquarium-helper.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Big Shape City', 'Walk through a city made entirely of shapes — triangle rooftops, circular manholes, and more!', 'math', '2-6 years', 10, '', '/the-big-shape-city/the-big-shape-city.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- LANGUAGE LEARNING (9 new templates)
  -- ============================================================

  INSERT INTO story_templates (title, description, category, age_range, scene_count, cover_label, thumbnail_url, generation_model_id, fixed_prompt_parts, script_data, is_active)
  VALUES
    ('Colors of the Carnival', 'Visit a vibrant carnival where every attraction is a different color!', 'language', '2-6 years', 10, '', '/colors-of-the-carnival/colors-of-the-carnival.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Opposites at the Playground', 'Discover opposites like up/down, fast/slow, and big/small through playground adventures!', 'language', '2-6 years', 10, '', '/opposites-at-the-playground/opposites-at-the-playground.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Feelings Farm', 'Meet farm animals expressing different emotions — and mirror and name each feeling!', 'language', '2-6 years', 10, '', '/the-feelings-farm/the-feelings-farm.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('A Day in My Body', 'Learn body part names through a fun active day: running with legs, tasting with tongue!', 'language', '2-6 years', 10, '', '/a-day-in-my-body/a-day-in-my-body.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Vehicles on the Go', 'Each letter introduces a vehicle: A for Ambulance, B for Bulldozer, C for Cable Car!', 'language', '2-6 years', 10, '', '/vehicles-on-the-go/vehicles-on-the-go.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Animals Around the World', 'Each letter introduces an animal from a different continent — aardvark in Africa, yak in Tibet!', 'language', '2-6 years', 10, '', '/animals-around-the-world/animals-around-the-world.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Action Heroes', 'Jump, climb, swim, dig, fly, and dance through 10 action words!', 'language', '2-6 years', 10, '', '/action-heroes/action-heroes.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('My Five Senses Adventure', 'Explore a new place where each scene highlights one sense: see, hear, smell, taste, and touch!', 'language', '2-6 years', 10, '', '/my-five-senses-adventure/my-five-senses-adventure.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Weather Words', 'Experience 10 types of weather and learn vocabulary and what to wear!', 'language', '2-6 years', 10, '', '/weather-words/weather-words.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- WORLD KNOWLEDGE (9 new templates)
  -- ============================================================

  INSERT INTO story_templates (title, description, category, age_range, scene_count, cover_label, thumbnail_url, generation_model_id, fixed_prompt_parts, script_data, is_active)
  VALUES
    ('From Seed to Supermarket', 'Follow a tomato from a seed on a farm through a truck, warehouse, and to the grocery store shelf!', 'world', '2-6 years', 10, '', '/from-seed-to-supermarket/from-seed-to-supermarket.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Under the Ocean', 'Explore coral reefs, deep sea creatures, and ocean geography in a submarine!', 'world', '2-6 years', 10, '', '/under-the-ocean/under-the-ocean.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Into the Rainforest', 'Trek through a rainforest canopy, encountering layers of life from jungle floor to treetops!', 'world', '2-6 years', 10, '', '/into-the-rainforest/into-the-rainforest.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Construction Site', 'Watch a building go up from a hole in the ground to a finished skyscraper!', 'world', '2-6 years', 10, '', '/the-construction-site/the-construction-site.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Around the World in 10 Meals', 'Sit down to eat a different dish in a different country each scene — sushi, tacos, injera, and more!', 'world', '2-6 years', 10, '', '/around-the-world-in-10-meals/around-the-world-in-10-meals.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Weather Station', 'Help a meteorologist track clouds, measure rain, and launch a weather balloon!', 'world', '2-6 years', 10, '', '/the-weather-station/the-weather-station.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Night Sky Explorer', 'With a telescope, identify the moon, planets, and constellations from your backyard!', 'world', '2-6 years', 10, '', '/night-sky-explorer/night-sky-explorer.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Hospital Helper', 'Visit a hospital, meet nurses and doctors, and learn about tools like stethoscopes and X-rays!', 'world', '2-6 years', 10, '', '/the-hospital-helper/the-hospital-helper.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The River''s Journey', 'Follow a river from a mountain spring all the way to the sea, meeting animals and ecosystems!', 'world', '2-6 years', 10, '', '/the-rivers-journey/the-rivers-journey.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SCI-FI & FANTASY (9 new templates)
  -- ============================================================

  INSERT INTO story_templates (title, description, category, age_range, scene_count, cover_label, thumbnail_url, generation_model_id, fixed_prompt_parts, script_data, is_active)
  VALUES
    ('The Time Traveler''s Backpack', 'Find a magical backpack that transports you to different eras: dinosaurs, ancient Egypt, medieval castles!', 'scifi', '2-6 years', 10, '', '/the-time-travelers-backpack/the-time-travelers-backpack.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Planet of the Colors', 'A distant planet has lost all its color — restore each color to a different part of the planet!', 'scifi', '2-6 years', 10, '', '/planet-of-the-colors/planet-of-the-colors.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Dream Architect', 'At night, discover you can build anything in your dreams — each scene is a wild dreamscape!', 'scifi', '2-6 years', 10, '', '/the-dream-architect/the-dream-architect.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Robot Best Friend', 'Build a robot companion and go on errands through a futuristic city together!', 'scifi', '2-6 years', 10, '', '/the-robot-best-friend/the-robot-best-friend.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Guardians of the Forest', 'Ancient woodland spirits choose you to protect a magical forest from a creeping darkness!', 'scifi', '2-6 years', 10, '', '/guardians-of-the-forest/guardians-of-the-forest.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Cloud Castle', 'Ride a flying vehicle to a castle made of clouds where weather is made — and fix a broken storm machine!', 'scifi', '2-6 years', 10, '', '/the-cloud-castle/the-cloud-castle.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Smallest Astronaut', 'Shrink to ant size and navigate a house where a drop of water is a lake and a bookshelf is a mountain!', 'scifi', '2-6 years', 10, '', '/the-smallest-astronaut/the-smallest-astronaut.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Portal Map', 'Receive a treasure map with portals to 10 magical mini-worlds — each portal is one scene!', 'scifi', '2-6 years', 10, '', '/the-portal-map/the-portal-map.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Star Catcher', 'A fallen star is lost on Earth and needs your help to find its way back home!', 'scifi', '2-6 years', 10, '', '/the-star-catcher/the-star-catcher.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- PURE SCIENCE (10 new templates)
  -- ============================================================

  INSERT INTO story_templates (title, description, category, age_range, scene_count, cover_label, thumbnail_url, generation_model_id, fixed_prompt_parts, script_data, is_active)
  VALUES
    ('How a Volcano Works', 'Hike to an active volcano as a junior volcanologist, study lava flow, and learn how eruptions shape the Earth!', 'science', '2-6 years', 10, '', '/how-a-volcano-works/how-a-volcano-works.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Inside the Human Body', 'Shrink down and travel through your own body — heart pumping, lungs breathing, food digesting!', 'science', '2-6 years', 10, '', '/inside-the-human-body/inside-the-human-body.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Life of a Butterfly', 'Follow a single butterfly from egg to caterpillar to chrysalis to butterfly in a lush garden!', 'science', '2-6 years', 10, '', '/the-life-of-a-butterfly/the-life-of-a-butterfly.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Where Does Water Go?', 'Follow a single raindrop through the full water cycle — ocean, evaporation, cloud, rainfall, river, back to ocean!', 'science', '2-6 years', 10, '', '/where-does-water-go/where-does-water-go.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Earthquake Investigator', 'Join a seismologist studying tectonic plates, fault lines, and how earthquakes are measured!', 'science', '2-6 years', 10, '', '/the-earthquake-investigator/the-earthquake-investigator.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Light and Shadows', 'Experiment with a flashlight, prisms, and mirrors to learn how light travels, bends, and creates rainbows!', 'science', '2-6 years', 10, '', '/light-and-shadows/light-and-shadows.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Magnetic World', 'Discover magnetism through experiments with everyday objects, compasses, and a giant electromagnet!', 'science', '2-6 years', 10, '', '/the-magnetic-world/the-magnetic-world.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('A Day in the Life of a Seed', 'Follow a single seed pushed underground by rain, cracking open, sprouting roots, and pushing toward light!', 'science', '2-6 years', 10, '', '/a-day-in-the-life-of-a-seed/a-day-in-the-life-of-a-seed.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('Forces All Around Us', 'Spend a day noticing push, pull, gravity, and friction — sliding a slide, throwing a ball, pushing a cart!', 'science', '2-6 years', 10, '', '/forces-all-around-us/forces-all-around-us.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true),
    ('The Deep Freeze', 'Join a polar expedition and learn about glaciers, permafrost, icebergs, and how frozen water carves landscapes!', 'science', '2-6 years', 10, '', '/the-deep-freeze/the-deep-freeze.png', nano_banana_pro_model_id, '{}'::jsonb, '{}'::jsonb, true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Inserted 46 coming-soon story templates across 5 categories';
END $$;
