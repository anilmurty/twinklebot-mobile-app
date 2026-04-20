-- Migration 073: Update Stripe product and price IDs for new Stripe account
-- Run this AFTER updating the Stripe env vars in Vercel

-- Premium Single Storybook ($3.99, 1 story)
UPDATE subscription_plans
SET stripe_price_id = 'price_1TO0t1ICJuNmZBaM7PhvIMpA',
    stripe_product_id = 'prod_UMkNr3eXfZQ5g1'
WHERE quality_tier = 'premium' AND stories_per_period = 1 AND plan_type = 'one-time';

-- Premium 2-Story Bundle ($6.99)
UPDATE subscription_plans
SET stripe_price_id = 'price_1TO0u6ICJuNmZBaMU05xNaKS',
    stripe_product_id = 'prod_UMkO3YXzuCwXso'
WHERE quality_tier = 'premium' AND stories_per_period = 2 AND plan_type = 'one-time';

-- Premium 3-Story Bundle ($9.99)
UPDATE subscription_plans
SET stripe_price_id = 'price_1TO0v3ICJuNmZBaMfARZWRN',
    stripe_product_id = 'prod_UMkP8zyWezC0dr'
WHERE quality_tier = 'premium' AND stories_per_period = 3 AND plan_type = 'one-time';

-- Premium 4-Story Bundle ($12.99)
UPDATE subscription_plans
SET stripe_price_id = 'price_1TO0w1ICJuNmZBaMljsmHskM',
    stripe_product_id = 'prod_UMkQYYiETxY37b'
WHERE quality_tier = 'premium' AND stories_per_period = 4 AND plan_type = 'one-time';

-- Deactivate basic tier plans (not created in new Stripe account)
UPDATE subscription_plans
SET is_active = false
WHERE quality_tier = 'basic';

-- Deactivate old subscription plans (not created in new Stripe account)
UPDATE subscription_plans
SET is_active = false
WHERE plan_type = 'subscription';

-- Verify
SELECT id, name, stripe_price_id, stripe_product_id, price_amount, stories_per_period, quality_tier, is_active
FROM subscription_plans
ORDER BY is_active DESC, quality_tier, stories_per_period;
