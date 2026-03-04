-- Migration: 038_add_quality_tiers.sql
-- Description: Add quality tier support (basic/premium) with separate credit pools
-- Created: 2026-03-04

-- 1. Add separate credit columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS basic_credits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS premium_credits INTEGER NOT NULL DEFAULT 0;

-- 2. Migrate existing story_credits to basic_credits
UPDATE profiles
SET basic_credits = COALESCE(story_credits, 0)
WHERE story_credits > 0;

-- 3. Add quality_tier to storybooks (nullable, 'basic' or 'premium')
ALTER TABLE storybooks
  ADD COLUMN IF NOT EXISTS quality_tier TEXT;

-- 4. Add quality_tier to subscription_plans (default 'basic')
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS quality_tier TEXT NOT NULL DEFAULT 'basic';

-- 5. Add check constraint for valid quality_tier values on storybooks
ALTER TABLE storybooks
  ADD CONSTRAINT storybooks_quality_tier_check
  CHECK (quality_tier IS NULL OR quality_tier IN ('basic', 'premium'));

-- 6. Add check constraint for valid quality_tier values on subscription_plans
ALTER TABLE subscription_plans
  ADD CONSTRAINT subscription_plans_quality_tier_check
  CHECK (quality_tier IN ('basic', 'premium'));

COMMENT ON COLUMN profiles.basic_credits IS 'Credits for basic quality storybooks (nano-banana model)';
COMMENT ON COLUMN profiles.premium_credits IS 'Credits for premium quality storybooks (nano-banana-pro model)';
COMMENT ON COLUMN storybooks.quality_tier IS 'Quality tier: basic (nano-banana) or premium (nano-banana-pro)';
COMMENT ON COLUMN subscription_plans.quality_tier IS 'Which quality tier this plan purchases credits for';
