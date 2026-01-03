-- Migration: 017_add_nano_banana_pro_model.sql
-- Description: Add nano-banana-pro model configuration for higher quality image generation
-- Created: 2024-01-01

-- Insert nano-banana-pro model configuration
INSERT INTO generation_models (
  name,
  provider,
  model_identifier,
  prompt_structure,
  api_config,
  is_active
) VALUES (
  'nano-banana-pro',
  'replicate',
  'google/nano-banana-pro', -- Model name (can be version ID if needed)
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

