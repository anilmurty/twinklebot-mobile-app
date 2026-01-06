-- Migration: 021_create_subscriptions_table.sql
-- Description: Create subscriptions table to track user subscriptions
-- Created: 2024-01-01

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false NOT NULL,
  canceled_at TIMESTAMPTZ,
  stories_used_this_period INTEGER DEFAULT 0 NOT NULL, -- Track stories generated in current period
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Add unique constraint: one active subscription per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_active 
ON subscriptions(user_id) 
WHERE status = 'active';

-- Add comments
COMMENT ON TABLE subscriptions IS 'User subscriptions to payment plans. Tracks Stripe subscription details and usage.';
COMMENT ON COLUMN subscriptions.stories_used_this_period IS 'Number of stories generated in the current billing period. Reset when period renews.';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'If true, subscription will cancel at the end of current period but remains active until then.';

