-- Migration: 025_create_character_looks_table.sql
-- Description: Create character_looks table for story-specific character appearance options
-- Created: 2024-01-01

-- Character looks table
-- Stores different appearance options (outfits/styles) for characters in specific stories
CREATE TABLE IF NOT EXISTS character_looks (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES story_templates(id) ON DELETE CASCADE,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  look_name TEXT NOT NULL, -- e.g., "Safari Explorer", "Zoo Keeper", "Animal Lover"
  display_order INTEGER NOT NULL DEFAULT 0, -- Order in which looks are displayed
  reference_image_url TEXT NOT NULL, -- URL to reference image shown to user and passed to Replicate
  prompt_modifier TEXT NOT NULL, -- Additional prompt text to modify character generation for this look
  is_original BOOLEAN DEFAULT false, -- If true, this is the "original" option (uses uploaded photo as-is)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, gender, look_name)
);

-- Index for faster lookups by template and gender
CREATE INDEX IF NOT EXISTS idx_character_looks_template_gender ON character_looks(template_id, gender, is_active);

-- Index for display order
CREATE INDEX IF NOT EXISTS idx_character_looks_display_order ON character_looks(template_id, gender, display_order);

COMMENT ON TABLE character_looks IS 'Stores character appearance options (looks) for each story template, organized by gender';
COMMENT ON COLUMN character_looks.reference_image_url IS 'URL to reference image shown to user and passed to Replicate API';
COMMENT ON COLUMN character_looks.prompt_modifier IS 'Additional prompt text to modify character generation for this specific look';
COMMENT ON COLUMN character_looks.is_original IS 'If true, uses the original uploaded photo without modifications';

