-- Migration: 046_populate_s_z_mock_story_data.sql
-- Description: Populate mock_story_data for Alphabet Adventures (S - Z) template
-- Created: 2026-03-05

DO $$
DECLARE
  alphabet_s_z_id INTEGER;
BEGIN
  SELECT id INTO alphabet_s_z_id
  FROM story_templates
  WHERE title = 'Alphabet Adventures in the Neighborhood (S - Z)'
  LIMIT 1;

  IF alphabet_s_z_id IS NOT NULL THEN
    UPDATE story_templates
    SET mock_story_data = '{
      "character_name": "Alex",
      "scenes": [
        {
          "scene_number": 1,
          "headline": "S for Sun",
          "script_text": "S is for sun shining so bright,\nAlex squints and smiles in the light.",
          "text": "S is for sun shining so bright,\nAlex squints and smiles in the light.",
          "image_url": "/alphabet-general/mock-story/s-sun.png"
        },
        {
          "scene_number": 2,
          "headline": "T for Tree",
          "script_text": "T is for tree standing tall,\nAlex looks up and sees it all.",
          "text": "T is for tree standing tall,\nAlex looks up and sees it all.",
          "image_url": "/alphabet-general/mock-story/t-tree.png"
        },
        {
          "scene_number": 3,
          "headline": "U for Umbrella",
          "script_text": "U is for umbrella open wide,\nAlex stays dry with rain outside.",
          "text": "U is for umbrella open wide,\nAlex stays dry with rain outside.",
          "image_url": "/alphabet-general/mock-story/u-umbrella.png"
        },
        {
          "scene_number": 4,
          "headline": "V for Van",
          "script_text": "V is for van parked nearby,\nAlex looks on as cars go by.",
          "text": "V is for van parked nearby,\nAlex looks on as cars go by.",
          "image_url": "/alphabet-general/mock-story/v-van.png"
        },
        {
          "scene_number": 5,
          "headline": "W for Windmill",
          "script_text": "W is for windmill spinning slow,\nAlex watches blades turn to and fro.",
          "text": "W is for windmill spinning slow,\nAlex watches blades turn to and fro.",
          "image_url": "/alphabet-general/mock-story/w-windmill.png"
        },
        {
          "scene_number": 6,
          "headline": "X for Xylophone",
          "script_text": "X is for xylophone, tap-tap-tap,\nAlex plays notes—tap, tap, tap!",
          "text": "X is for xylophone, tap-tap-tap,\nAlex plays notes—tap, tap, tap!",
          "image_url": "/alphabet-general/mock-story/x-xylophone.png"
        },
        {
          "scene_number": 7,
          "headline": "Y for Yard",
          "script_text": "Y is for yard with grass so green,\nAlex stands where flowers are seen.",
          "text": "Y is for yard with grass so green,\nAlex stands where flowers are seen.",
          "image_url": "/alphabet-general/mock-story/y-yard.png"
        },
        {
          "scene_number": 8,
          "headline": "Z for Zoo",
          "script_text": "Z is for zoo—what a day!\nAlex looks around in wonder and play.",
          "text": "Z is for zoo—what a day!\nAlex looks around in wonder and play.",
          "image_url": "/alphabet-general/mock-story/z-zoo.png"
        }
      ]
    }'::jsonb
    WHERE id = alphabet_s_z_id;

    RAISE NOTICE 'Populated mock_story_data for Alphabet Adventures S-Z (id: %)', alphabet_s_z_id;
  ELSE
    RAISE NOTICE 'Alphabet Adventures (S - Z) template not found.';
  END IF;
END $$;
