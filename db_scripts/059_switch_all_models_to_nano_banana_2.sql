-- Migration: 059_switch_all_models_to_nano_banana_2.sql
-- Description: Update all generation models to use nano-banana-2 instead of nano-banana-pro
-- This consolidates all image generation to a single model

UPDATE generation_models
SET model_identifier = 'google/nano-banana-2',
    name = REPLACE(name, 'nano-banana-pro', 'nano-banana-2')
WHERE model_identifier = 'google/nano-banana-pro';
