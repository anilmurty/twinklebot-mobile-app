-- Migration: 022_seed_subscription_plans.sql
-- Description: Seed initial subscription plans
-- Created: 2024-01-01
-- Note: Replace STRIPE_PRICE_ID_* and STRIPE_PRODUCT_ID_* with actual Stripe IDs after creating products/prices in Stripe dashboard

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
    'One-Time Purchase',
    'Purchase just this story without a subscription',
    'price_1SlwJpDbYKJXeWqLJd3rPtf6', -- Replace with actual Stripe price ID
    'prod_TjP8prod_Tjsp07ktxQDoYTyGLKIdfBq', -- Replace with actual Stripe product ID
    'one-time',
    799, -- $7.99 in cents
    'usd',
    NULL, -- One-time has no billing interval
    1,
    true,
    1,
    '["Purchase just this story", "No subscription required", "One-time payment"]'::jsonb
  ),
  (
    'Monthly Subscription',
    'A new adventure starring your child, every month',
    'price_1SmP3TDbYKJXeWqLBVf8DU94', -- Replace with actual Stripe price ID
    'prod_Tjsp07ktxQDoYT', -- Replace with actual Stripe product ID
    'subscription',
    499, -- $4.99 in cents
    'usd',
    'month',
    1,
    true,
    2,
    '["A new adventure every month", "Save 40% per story", "High-quality keepsakes", "Cancel anytime"]'::jsonb
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
COMMENT ON TABLE subscription_plans IS 'After creating products and prices in Stripe dashboard, update the stripe_price_id and stripe_product_id values in this seed data.';

