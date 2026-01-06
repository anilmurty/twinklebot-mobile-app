-- Migration: 023_cleanup_duplicate_subscription_plans.sql
-- Description: Remove duplicate subscription plans with placeholder Stripe IDs
-- Created: 2024-01-01

-- Delete plans with placeholder Stripe IDs (keep only plans with actual Stripe IDs)
DELETE FROM subscription_plans
WHERE stripe_price_id IN (
  'STRIPE_PRICE_ID_ONETIME',
  'STRIPE_PRICE_ID_MONTHLY'
);

-- Verify cleanup
-- Should only have 2 plans remaining: one one-time and one subscription with actual Stripe IDs
SELECT id, name, plan_type, stripe_price_id, price_amount
FROM subscription_plans
WHERE is_active = true
ORDER BY display_order;

