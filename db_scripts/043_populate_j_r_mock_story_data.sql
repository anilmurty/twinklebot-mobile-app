-- Migration: 043_populate_j_r_mock_story_data.sql
-- Description: Populate mock_story_data for Alphabet Adventures (J - R) template
-- Created: 2026-03-05

DO $$
DECLARE
  alphabet_j_r_id INTEGER;
BEGIN
  SELECT id INTO alphabet_j_r_id
  FROM story_templates
  WHERE title = 'Alphabet Adventures in the Neighborhood (J - R)'
  LIMIT 1;

  IF alphabet_j_r_id IS NOT NULL THEN
    UPDATE story_templates
    SET mock_story_data = '{
      "character_name": "Alex",
      "scenes": [
        {
          "scene_number": 1,
          "headline": "J for Jam",
          "script_text": "J is for Jam in jars so neat,\nAlex spots one that looks so sweet.",
          "text": "J is for Jam in jars so neat,\nAlex spots one that looks so sweet.",
          "image_url": "/alphabet-general/mock-story/j-jam.png"
        },
        {
          "scene_number": 2,
          "headline": "K for Kite",
          "script_text": "K is for Kite flying up high,\nAlex watches it dance in the sky.",
          "text": "K is for Kite flying up high,\nAlex watches it dance in the sky.",
          "image_url": "/alphabet-general/mock-story/k-kite.png"
        },
        {
          "scene_number": 3,
          "headline": "L for Leaf",
          "script_text": "L is for Leaf drifting down,\nAlex watches it float to the ground.",
          "text": "L is for Leaf drifting down,\nAlex watches it float to the ground.",
          "image_url": "/alphabet-general/mock-story/l-leaf.png"
        },
        {
          "scene_number": 4,
          "headline": "M for Moon",
          "script_text": "M is for Moon glowing up high,\nAlex looks up at the nighttime sky.",
          "text": "M is for Moon glowing up high,\nAlex looks up at the nighttime sky.",
          "image_url": "/alphabet-general/mock-story/m-moon.png"
        },
        {
          "scene_number": 5,
          "headline": "N for Nest",
          "script_text": "N is for Nest up in a tree,\nAlex looks up quietly.",
          "text": "N is for Nest up in a tree,\nAlex looks up quietly.",
          "image_url": "/alphabet-general/mock-story/n-nest.png"
        },
        {
          "scene_number": 6,
          "headline": "O for Orange Cone",
          "script_text": "O is for Orange cone so bright,\nAlex sees it marking a site.",
          "text": "O is for Orange cone so bright,\nAlex sees it marking a site.",
          "image_url": "/alphabet-general/mock-story/o-orange-cone.png"
        },
        {
          "scene_number": 7,
          "headline": "P for Puddle",
          "script_text": "P is for puddle after rain,\nAlex looks down and splashes again.",
          "text": "P is for puddle after rain,\nAlex looks down and splashes again.",
          "image_url": "/alphabet-general/mock-story/p-puddle.png"
        },
        {
          "scene_number": 8,
          "headline": "Q for Quilt",
          "script_text": "Q is for quilt laid out wide,\nAlex sits softly by its side.",
          "text": "Q is for quilt laid out wide,\nAlex sits softly by its side.",
          "image_url": "/alphabet-general/mock-story/q-quilt.png"
        },
        {
          "scene_number": 9,
          "headline": "R for Road",
          "script_text": "R is for road stretching far,\nAlex looks out from inside the car.",
          "text": "R is for road stretching far,\nAlex looks out from inside the car.",
          "image_url": "/alphabet-general/mock-story/r-road.png"
        }
      ]
    }'::jsonb
    WHERE id = alphabet_j_r_id;

    RAISE NOTICE 'Populated mock_story_data for Alphabet Adventures J-R (id: %)', alphabet_j_r_id;
  ELSE
    RAISE NOTICE 'Alphabet Adventures (J - R) template not found.';
  END IF;
END $$;
