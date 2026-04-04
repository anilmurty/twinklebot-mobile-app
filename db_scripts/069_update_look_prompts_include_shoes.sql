-- Update character look prompt_modifiers to:
-- 1. Explicitly mention shoes/footwear (prevents AI from generating barefoot characters)
-- 2. Remove gender references (boy/girl) to avoid Gemini content moderation blocks

-- Step 1: Replace "dress this boy" and "dress this girl" with gender-neutral "dress this person"
UPDATE character_looks
SET prompt_modifier = REPLACE(prompt_modifier, 'dress this boy', 'dress this person')
WHERE prompt_modifier LIKE '%dress this boy%';

UPDATE character_looks
SET prompt_modifier = REPLACE(prompt_modifier, 'dress this girl', 'dress this person')
WHERE prompt_modifier LIKE '%dress this girl%';

-- Step 2: Replace "keep this boy" and "keep this girl" with gender-neutral "keep this person"
UPDATE character_looks
SET prompt_modifier = REPLACE(prompt_modifier, 'keep this boy', 'keep this person')
WHERE prompt_modifier LIKE '%keep this boy%';

UPDATE character_looks
SET prompt_modifier = REPLACE(prompt_modifier, 'keep this girl', 'keep this person')
WHERE prompt_modifier LIKE '%keep this girl%';

-- Step 3: Add footwear mention to all prompts that don't already have it
-- For "clothing shown in the image" prompts
UPDATE character_looks
SET prompt_modifier = REPLACE(
  prompt_modifier,
  'in the clothing shown in the image.',
  'in the complete outfit shown in the image, including shoes and footwear.'
)
WHERE prompt_modifier LIKE '%in the clothing shown in the image.%';

-- For "astronaut suit" prompts
UPDATE character_looks
SET prompt_modifier = REPLACE(
  prompt_modifier,
  'in the astronaut suit shown in the image.',
  'in the complete astronaut suit shown in the image, including boots and footwear.'
)
WHERE prompt_modifier LIKE '%in the astronaut suit shown in the image.%';

-- For "pajamas" prompts
UPDATE character_looks
SET prompt_modifier = REPLACE(
  prompt_modifier,
  'in the pajamas shown in the image.',
  'in the pajamas shown in the image, including any slippers or footwear.'
)
WHERE prompt_modifier LIKE '%in the pajamas shown in the image.%';

-- For "current outfit" prompts
UPDATE character_looks
SET prompt_modifier = REPLACE(
  prompt_modifier,
  'in their current outfit.',
  'in their current outfit including shoes/footwear.'
)
WHERE prompt_modifier LIKE '%in their current outfit.%'
  AND prompt_modifier NOT LIKE '%shoes%';

-- Catch-all: any remaining prompts without footwear mention
UPDATE character_looks
SET prompt_modifier = REPLACE(
  prompt_modifier,
  'keep facial and body features identical to the original image. white background, forward facing and full length',
  'keep facial and body features identical to the original image. ensure shoes/footwear are included. white background, forward facing and full length'
)
WHERE prompt_modifier NOT LIKE '%shoes%'
  AND prompt_modifier NOT LIKE '%footwear%'
  AND prompt_modifier NOT LIKE '%boots%'
  AND prompt_modifier NOT LIKE '%slippers%'
  AND prompt_modifier LIKE '%white background, forward facing and full length%';
