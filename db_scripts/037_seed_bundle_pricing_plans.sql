-- Migration: 037_seed_bundle_pricing_plans.sql
-- Description: Add bundle pricing plans and deactivate subscription plans for Phase 1
-- Created: 2026-01-13
-- Note: Replace STRIPE_PRICE_ID_* with actual Stripe IDs after creating products/prices in Stripe dashboard

-- First, deactivate subscription plans (we'll re-enable them in Phase 2)
UPDATE subscription_plans
SET is_active = false, updated_at = NOW()
WHERE plan_type = 'subscription';

-- Update existing one-time plan to be "Single Storybook"
UPDATE subscription_plans
SET 
  name = 'Single Storybook',
  description = 'One personalized storybook starring your child',
  stories_per_period = 1,
  display_order = 1,
  is_active = true,
  features = '["One personalized storybook", "Yours to keep forever", "No subscription required"]'::jsonb,
  updated_at = NOW()
WHERE plan_type = 'one-time' AND price_amount = 799;

-- Also update any one-time plan that might not have stories_per_period set
UPDATE subscription_plans
SET stories_per_period = 1
WHERE plan_type = 'one-time' AND (stories_per_period IS NULL OR stories_per_period = 0);

-- Insert bundle plans
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
  features
) VALUES
  (
    '2-Story Bundle',
    'Two personalized storybooks for your child',
    'price_1SpGwLDbYKJXeWqLwRlN2O6y', -- Replace with actual Stripe price ID
    'prod_TmqdyT30v2Lh3y', -- Replace with actual Stripe product ID
    'one-time',
    1399, -- $13.99 in cents
    'usd',
    NULL,
    2,
    true,
    2,
    '["Two personalized storybooks", "Save 12%", "Perfect for siblings or variety", "Yours to keep forever"]'::jsonb
  ),
  (
    '3-Story Bundle',
    'Three personalized storybooks for your child',
    'price_1SpGy5DbYKJXeWqLL8T7X7yn', -- Replace with actual Stripe price ID
    'prod_TmqfcczyVZ9uIZ', -- Replace with actual Stripe product ID
    'one-time',
    1999, -- $19.99 in cents
    'usd',
    NULL,
    3,
    true,
    3,
    '["Three personalized storybooks", "Save 17%", "Ideal for bedtime variety", "Yours to keep forever"]'::jsonb
  ),
  (
    '4-Story Bundle',
    'Complete Starter Library - All four personalized storybooks',
    'price_1SpGyvDbYKJXeWqLNHMQqhgE', -- Replace with actual Stripe price ID
    'prod_Tmqgj8Vy6t0Ten', -- Replace with actual Stripe product ID
    'one-time',
    2499, -- $24.99 in cents
    'usd',
    NULL,
    4,
    true,
    4,
    '["Four personalized storybooks", "Best value - Save 22%", "Complete starter library", "Yours to keep forever"]'::jsonb
  )
ON CONFLICT (stripe_price_id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  stripe_product_id = EXCLUDED.stripe_product_id,
  plan_type = EXCLUDED.plan_type,
  price_amount = EXCLUDED.price_amount,
  currency = EXCLUDED.currency,
  billing_interval = EXCLUDED.billing_interval,
  stories_per_period = EXCLUDED.stories_per_period,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Add comment
COMMENT ON TABLE subscription_plans IS 'Phase 1: One-time purchase plans only. Bundle plans offer story credits. After creating products and prices in Stripe dashboard, update the stripe_price_id and stripe_product_id values.';

