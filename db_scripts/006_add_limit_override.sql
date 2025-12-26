-- Migration: Add custom limit override for profiles
-- Allows per-user limit increases (e.g., for early users, coupons, etc.)

-- Add custom_stories_per_month column (NULL means use default plan limit)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS custom_stories_per_month INTEGER DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN profiles.custom_stories_per_month IS 'Custom monthly story limit override. NULL = use default plan limit. Set to a number to override the plan limit for this user (e.g., for early users, coupons, promotions).';

-- Example: Give a specific user 100 stories per month
-- UPDATE profiles SET custom_stories_per_month = 100 WHERE email = 'user@example.com';

-- Example: Give a user unlimited stories (set to a very high number)
-- UPDATE profiles SET custom_stories_per_month = 999999 WHERE email = 'vip@example.com';

-- Example: Remove override (revert to plan default)
-- UPDATE profiles SET custom_stories_per_month = NULL WHERE email = 'user@example.com';

