-- Migration: 065_seed_seedream_model.sql
-- Description: Add ByteDance seedream-4.5 model and switch all templates to use it
-- seedream-4.5 replaces google/nano-banana-2 as the default image generation model
-- Key differences from nano-banana:
--   - Does NOT support output_format param
--   - Does NOT support 'match_input_image' aspect_ratio (use '9:16', '16:9', '1:1', '3:4')
--   - Supports image_input array same as nano-banana

INSERT INTO generation_models (
  name,
  provider,
  model_identifier,
  prompt_structure,
  api_config,
  is_active
) VALUES (
  'seedream-4.5',
  'replicate',
  'bytedance/seedream-4.5',
  '{
    "parts_order": ["subject", "action", "detail", "style"],
    "separator": "\n\n",
    "placeholders": {
      "character_name": "{character_name}"
    },
    "fixed_parts": ["subject", "style"],
    "variable_parts": ["action", "detail"]
  }'::jsonb,
  '{
    "endpoint": "https://api.replicate.com/v1/predictions",
    "auth_header": "Authorization",
    "auth_prefix": "Token",
    "input_params": {
      "prompt": "string",
      "image_input": "array",
      "aspect_ratio": "string"
    },
    "polling": {
      "interval_ms": 5000,
      "max_attempts": 60
    }
  }'::jsonb,
  true
)
ON CONFLICT (name) DO UPDATE
SET
  provider = EXCLUDED.provider,
  model_identifier = EXCLUDED.model_identifier,
  prompt_structure = EXCLUDED.prompt_structure,
  api_config = EXCLUDED.api_config,
  updated_at = NOW();

-- Switch all story templates to use seedream-4.5
UPDATE story_templates
SET generation_model_id = (
  SELECT id FROM generation_models WHERE name = 'seedream-4.5'
)
WHERE generation_model_id IN (
  SELECT id FROM generation_models WHERE name IN ('nano-banana', 'nano-banana-2')
);

-- Deactivate old nano-banana models (keep rows for history)
UPDATE generation_models
SET is_active = false
WHERE name IN ('nano-banana', 'nano-banana-2');
