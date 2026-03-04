-- Migration: 039_seed_tier_pricing_plans.sql
-- Description: Update existing plans to basic tier pricing, add premium tier plans
-- Created: 2026-03-04
--
-- TODO before running:
--   1. Replace STRIPE_PRICE_ID_BASIC_* / STRIPE_PRODUCT_ID_BASIC_* with actual Stripe IDs
--   2. Verify the premium Stripe IDs below are correct

-- 1. Set all existing one-time plans to quality_tier = 'basic'
UPDATE subscription_plans
SET quality_tier = 'basic', updated_at = NOW()
WHERE plan_type = 'one-time';

-- 2. Update basic tier prices AND Stripe IDs (recreated products since old ones had transactions)
-- Single Storybook: $0.99
UPDATE subscription_plans
SET
  name = 'Basic Single Storybook',
  price_amount = 99,
  stripe_price_id = 'price_1T7Kg3DbYKJXeWqLWTJJrqHo',   -- TODO: fill in
  stripe_product_id = 'prod_U5Vh23caQGHW7F', -- TODO: fill in
  updated_at = NOW()
WHERE plan_type = 'one-time' AND stories_per_period = 1 AND quality_tier = 'basic';

-- 2-Story Bundle: $1.49
UPDATE subscription_plans
SET
  name = 'Basic 2-Story Bundle',
  price_amount = 149,
  stripe_price_id = 'price_1T7KgcDbYKJXeWqLjd7PBv0H',   -- TODO: fill in
  stripe_product_id = 'prod_U5ViWtqDfa1msG', -- TODO: fill in
  updated_at = NOW()
WHERE plan_type = 'one-time' AND stories_per_period = 2 AND quality_tier = 'basic';

-- 3-Story Bundle: $1.99
UPDATE subscription_plans
SET
  name = 'Basic 3-Story Bundle',
  price_amount = 199,
  stripe_price_id = 'price_1T7KjRDbYKJXeWqLkUtVsXt7',   -- TODO: fill in
  stripe_product_id = 'prod_U5VkGYhTT8lmyT', -- TODO: fill in
  updated_at = NOW()
WHERE plan_type = 'one-time' AND stories_per_period = 3 AND quality_tier = 'basic';

-- 4-Story Bundle: $2.49
UPDATE subscription_plans
SET
  name = 'Basic 4-Story Bundle',
  price_amount = 249,
  stripe_price_id = 'price_1T7Kn1DbYKJXeWqLUGwhNV69',   -- TODO: fill in
  stripe_product_id = 'prod_U5VoKzlVj2vHRS', -- TODO: fill in
  updated_at = NOW()
WHERE plan_type = 'one-time' AND stories_per_period = 4 AND quality_tier = 'basic';

-- 3. Insert premium tier plans
-- NOTE: stripe_price_id = price_*, stripe_product_id = prod_*
INSERT INTO subscription_plans (
  name,
  description,
  stripe_price_id,
  stripe_product_id,
  plan_type,
  price_amount,
  currency,
  billing_interval,
  stories_per_period,
  is_active,
  display_order,
  features,
  quality_tier
) VALUES
  (
    'Premium Single Storybook',
    'One premium quality personalized storybook',
    'price_1T7KeHDbYKJXeWqLiVIgRHRF',
    'prod_U5Vfl20zNyUaw9',
    'one-time',
    399, -- $3.99
    'usd',
    NULL,
    1,
    true,
    11,
    '["One premium storybook", "Higher quality AI images", "Yours to keep forever"]'::jsonb,
    'premium'
  ),
  (
    'Premium 2-Story Bundle',
    'Two premium quality personalized storybooks',
    'price_1SpGwLDbYKJXeWqLwRlN2O6y',
    'prod_TmqdyT30v2Lh3y',
    'one-time',
    699, -- $6.99
    'usd',
    NULL,
    2,
    true,
    12,
    '["Two premium storybooks", "Save 12%", "Higher quality AI images", "Yours to keep forever"]'::jsonb,
    'premium'
  ),
  (
    'Premium 3-Story Bundle',
    'Three premium quality personalized storybooks',
    'price_1SpGy5DbYKJXeWqLL8T7X7yn',
    'prod_TmqfcczyVZ9uIZ',
    'one-time',
    999, -- $9.99
    'usd',
    NULL,
    3,
    true,
    13,
    '["Three premium storybooks", "Save 17%", "Higher quality AI images", "Yours to keep forever"]'::jsonb,
    'premium'
  ),
  (
    'Premium 4-Story Bundle',
    'Complete Premium Starter Library - All four premium storybooks',
    'price_1T7KesDbYKJXeWqLEujcrGC5',
    'prod_U5Vg4uAkzNIyqx',
    'one-time',
    1299, -- $12.99
    'usd',
    NULL,
    4,
    true,
    14,
    '["Four premium storybooks", "Best value - Save 19%", "Higher quality AI images", "Yours to keep forever"]'::jsonb,
    'premium'
  );

COMMENT ON TABLE subscription_plans IS 'Phase 1: One-time purchase plans with basic and premium quality tiers. Basic uses nano-banana, premium uses nano-banana-pro model.';
