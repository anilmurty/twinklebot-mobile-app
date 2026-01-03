-- Migration: 018_set_default_limit_to_one.sql
-- Description: Change default monthly story limit from 3 to 1
-- Created: 2024-01-01

-- Update default value for new profiles
ALTER TABLE profiles
ALTER COLUMN stories_per_month SET DEFAULT 1;

-- Update existing profiles that still have the old default (3) to 1
-- Only update if they don't have a custom override
UPDATE profiles
SET stories_per_month = 1
WHERE stories_per_month = 3
  AND custom_stories_per_month IS NULL;

-- Add comment explaining the default
COMMENT ON COLUMN profiles.stories_per_month IS 'Default monthly story limit. Default is 1 story per month. Can be overridden with custom_stories_per_month.';
