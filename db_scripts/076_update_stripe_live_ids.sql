-- Migration 076: Replace test-mode Stripe IDs with live-mode IDs.
-- Run immediately before switching STRIPE_SECRET_KEY/PUBLISHABLE_KEY/WEBHOOK_SECRET
-- in Vercel to the sk_live_ / pk_live_ values.

-- Premium Single Storybook ($3.99)
UPDATE subscription_plans
SET stripe_price_id = 'price_1TOOgwIO6yfk9XV08GbSSIJ0',
    stripe_product_id = 'prod_UN8yRkcTFHi244'
WHERE quality_tier = 'premium' AND stories_per_period = 1 AND plan_type = 'one-time';

-- Premium 2-Story Bundle ($6.99)
UPDATE subscription_plans
SET stripe_price_id = 'price_1TOOhVIO6yfk9XV0M0N6xpz1',
    stripe_product_id = 'prod_UN8zUm9PSUPQPr'
WHERE quality_tier = 'premium' AND stories_per_period = 2 AND plan_type = 'one-time';

-- Premium 3-Story Bundle ($9.99)
UPDATE subscription_plans
SET stripe_price_id = 'price_1TOOiCIO6yfk9XV0mFczMD7k',
    stripe_product_id = 'prod_UN90d3pYX4LrhX'
WHERE quality_tier = 'premium' AND stories_per_period = 3 AND plan_type = 'one-time';

-- Premium 4-Story Bundle ($12.99)
UPDATE subscription_plans
SET stripe_price_id = 'price_1TOP3uIO6yfk9XV0SKn9fyu4',
    stripe_product_id = 'prod_UN9MljcBoIhXxD'
WHERE quality_tier = 'premium' AND stories_per_period = 4 AND plan_type = 'one-time';

-- Verify
SELECT id, name, stripe_price_id, stripe_product_id, price_amount, stories_per_period, is_active
FROM subscription_plans
WHERE is_active = true
ORDER BY stories_per_period;
