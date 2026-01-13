-- Migration: 036_add_story_credits_to_profiles.sql
-- Description: Add story_credits column to profiles for tracking purchased story credits
-- Created: 2026-01-13

-- Add story_credits column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS story_credits INTEGER NOT NULL DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN profiles.story_credits IS 'Number of story credits available for the user. Each credit unlocks one full storybook.';

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_story_credits ON profiles(story_credits) WHERE story_credits > 0;

