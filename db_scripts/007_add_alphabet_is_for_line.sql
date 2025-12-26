-- Migration: Add "A is for APPLE" line to all alphabet scenes
-- Updates script_text for all alphabet adventure templates to include the letter format line

-- Alphabet Adventure 1 (A-I)
UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,0,script_text}',
  '"A is for APPLE.\n{character_name} saw three red APPLES on the table!"'
)
WHERE title = 'Alphabet Adventure 1';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,1,script_text}',
  '"B is for BALL.\nLook at that! {character_name} found a big blue BALL."'
)
WHERE title = 'Alphabet Adventure 1';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,2,script_text}',
  '"C is for CAT.\n{character_name} met a very soft, fluffy CAT on the porch."'
)
WHERE title = 'Alphabet Adventure 1';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,3,script_text}',
  '"D is for DUCK.\nSplash! {character_name} is watching a happy DUCK."'
)
WHERE title = 'Alphabet Adventure 1';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,4,script_text}',
  '"E is for ELEPHANT.\n{character_name} saw a giant, gray ELEPHANT!"'
)
WHERE title = 'Alphabet Adventure 1';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,5,script_text}',
  '"F is for FROG.\nOne, two! {character_name} found a green FROG."'
)
WHERE title = 'Alphabet Adventure 1';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,6,script_text}',
  '"G is for GARDEN.\n{character_name} is helping water the GARDEN flowers."'
)
WHERE title = 'Alphabet Adventure 1';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,7,script_text}',
  '"H is for HAT.\n{character_name} is wearing a very silly yellow HAT!"'
)
WHERE title = 'Alphabet Adventure 1';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,8,script_text}',
  '"I is for ICE CREAM.\nBrrr! {character_name} is eating a cold, sweet ICE CREAM."'
)
WHERE title = 'Alphabet Adventure 1';

-- Alphabet Adventure 2 (J-R)
UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,0,script_text}',
  '"J is for JACKET.\n{character_name} put on a warm JACKET to go outside."'
)
WHERE title = 'Alphabet Adventure 2';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,1,script_text}',
  '"K is for KITE.\nHigh in the sky, {character_name} is flying a KITE."'
)
WHERE title = 'Alphabet Adventure 2';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,2,script_text}',
  '"L is for LADYBUG.\n{character_name} found a tiny LADYBUG on a leaf."'
)
WHERE title = 'Alphabet Adventure 2';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,3,script_text}',
  '"M is for MOON.\n{character_name} is looking at the big, white MOON."'
)
WHERE title = 'Alphabet Adventure 2';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,4,script_text}',
  '"N is for NEST.\n{character_name} found a bird''s NEST high in a tree."'
)
WHERE title = 'Alphabet Adventure 2';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,5,script_text}',
  '"O is for ORANGE.\n{character_name} is peeling a round, orange ORANGE."'
)
WHERE title = 'Alphabet Adventure 2';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,6,script_text}',
  '"P is for PUPPY.\n{character_name} is playing with a cute, spotted PUPPY."'
)
WHERE title = 'Alphabet Adventure 2';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,7,script_text}',
  '"Q is for QUIET.\nShhh! {character_name} is being very QUIET."'
)
WHERE title = 'Alphabet Adventure 2';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,8,script_text}',
  '"R is for RAINBOW.\nAfter the rain, {character_name} saw a RAINBOW."'
)
WHERE title = 'Alphabet Adventure 2';

-- Alphabet Adventure 3 (S-Z)
UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,0,script_text}',
  '"S is for SANDCASTLE.\n{character_name} is building a tall SANDCASTLE."'
)
WHERE title = 'Alphabet Adventure 3';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,1,script_text}',
  '"T is for TRAIN.\nChoo-choo! {character_name} is playing with a toy TRAIN."'
)
WHERE title = 'Alphabet Adventure 3';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,2,script_text}',
  '"U is for UMBRELLA.\n{character_name} stayed dry under a purple UMBRELLA."'
)
WHERE title = 'Alphabet Adventure 3';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,3,script_text}',
  '"V is for VASE.\n{character_name} put fresh flowers into a glass VASE."'
)
WHERE title = 'Alphabet Adventure 3';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,4,script_text}',
  '"W is for WHALE.\n{character_name} saw a big WHALE splash in the ocean!"'
)
WHERE title = 'Alphabet Adventure 3';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,5,script_text}',
  '"X is for XYLOPHONE.\n{character_name} is playing a song on the XYLOPHONE."'
)
WHERE title = 'Alphabet Adventure 3';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,6,script_text}',
  '"Y is for YO-YO.\nUp and down! {character_name} is playing with a YO-YO."'
)
WHERE title = 'Alphabet Adventure 3';

UPDATE story_templates
SET script_data = jsonb_set(
  script_data,
  '{scenes,7,script_text}',
  '"Z is for ZEBRA.\n{character_name} saw a striped ZEBRA at the zoo."'
)
WHERE title = 'Alphabet Adventure 3';

