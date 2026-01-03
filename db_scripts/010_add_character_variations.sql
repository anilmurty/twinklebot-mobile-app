-- Migration: 010_add_character_variations.sql
-- Description: Add character_variations table to store generated character variations (front/left/right) per character per template
-- Created: 2024-01-01

-- Character variations table
CREATE TABLE IF NOT EXISTS character_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES story_templates(id) ON DELETE CASCADE,
  front_variation_url TEXT NOT NULL,
  left_variation_url TEXT NOT NULL,
  right_variation_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, template_id)
);

-- Indexes for character variations
CREATE INDEX IF NOT EXISTS idx_character_variations_character_id ON character_variations(character_id);
CREATE INDEX IF NOT EXISTS idx_character_variations_template_id ON character_variations(template_id);
CREATE INDEX IF NOT EXISTS idx_character_variations_character_template ON character_variations(character_id, template_id);

-- Row Level Security
ALTER TABLE character_variations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for character_variations
DROP POLICY IF EXISTS "Users can view own character variations" ON character_variations;
CREATE POLICY "Users can view own character variations"
  ON character_variations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_variations.character_id
      AND characters.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create own character variations" ON character_variations;
CREATE POLICY "Users can create own character variations"
  ON character_variations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_variations.character_id
      AND characters.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own character variations" ON character_variations;
CREATE POLICY "Users can delete own character variations"
  ON character_variations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_variations.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE character_variations IS 'Generated character variations (front/left/right) for each character-template combination';
COMMENT ON COLUMN character_variations.front_variation_url IS 'URL to front-facing character variation image';
COMMENT ON COLUMN character_variations.left_variation_url IS 'URL to left-facing character variation image';
COMMENT ON COLUMN character_variations.right_variation_url IS 'URL to right-facing character variation image';
