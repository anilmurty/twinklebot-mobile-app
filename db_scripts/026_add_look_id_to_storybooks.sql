-- Migration: 026_add_look_id_to_storybooks.sql
-- Description: Add look_id field to storybooks table to store selected character look
-- Created: 2024-01-01

-- Add look_id column to storybooks table
ALTER TABLE storybooks
ADD COLUMN IF NOT EXISTS look_id INTEGER REFERENCES character_looks(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_storybooks_look_id ON storybooks(look_id);

COMMENT ON COLUMN storybooks.look_id IS 'Selected character look/appearance for this storybook. NULL means original photo was used.';

