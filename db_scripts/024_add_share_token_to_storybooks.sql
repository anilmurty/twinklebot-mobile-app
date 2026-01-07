-- Migration: 024_add_share_token_to_storybooks.sql
-- Description: Add share_token field to storybooks table for publicly shareable URLs
-- Created: 2024-01-01

-- Add share_token column (unique, nullable - only set when user requests sharing)
ALTER TABLE storybooks
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Create index for faster lookups by share_token
CREATE INDEX IF NOT EXISTS idx_storybooks_share_token ON storybooks(share_token)
WHERE share_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN storybooks.share_token IS 'Unique token for publicly shareable storybook URLs. Only generated on-demand when user requests sharing.';

