-- Migration: 002_seed_nano_banana_model.sql
-- Description: Seed the nano-banana generation model configuration
-- Created: 2024-01-01

-- Insert nano-banana model configuration
INSERT INTO generation_models (
  name,
  provider,
  model_identifier,
  prompt_structure,
  api_config,
  is_active
) VALUES (
  'nano-banana',
  'replicate',
  'google/nano-banana', -- Update with actual version ID when available
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
      "aspect_ratio": "string",
      "output_format": "string"
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

