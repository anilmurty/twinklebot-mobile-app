-- Migration: 061_seed_flux_2_pro_model.sql
-- Description: Add Black Forest Labs flux-2-pro model and switch all templates to use it
-- flux-2-pro replaces seedream-4.5 (which had content moderation issues)
-- Key differences from nano-banana/seedream:
--   - Uses 'input_images' param (not 'image_input')
--   - Does NOT support output_format
--   - Does NOT support 'match_input_image' aspect_ratio

INSERT INTO generation_models (
  name,
  provider,
  model_identifier,
  prompt_structure,
  api_config,
  is_active
) VALUES (
  'flux-2-pro',
  'replicate',
  'black-forest-labs/flux-2-pro',
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
      "input_images": "array",
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

-- Switch all story templates to use flux-2-pro
UPDATE story_templates
SET generation_model_id = (
  SELECT id FROM generation_models WHERE name = 'flux-2-pro'
)
WHERE generation_model_id IN (
  SELECT id FROM generation_models WHERE name IN ('nano-banana', 'nano-banana-2', 'seedream-4.5')
);

-- Deactivate old models (keep rows for history)
UPDATE generation_models
SET is_active = false
WHERE name IN ('nano-banana', 'nano-banana-2', 'seedream-4.5');
