-- Migration: 020_create_subscription_plans_table.sql
-- Description: Create subscription_plans table for flexible payment plan management
-- Created: 2024-01-01

CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  stripe_price_id TEXT NOT NULL UNIQUE,
  stripe_product_id TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('one-time', 'subscription')),
  price_amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  billing_interval TEXT CHECK (billing_interval IN ('week', 'month', 'year')) DEFAULT NULL, -- NULL for one-time
  stories_per_period INTEGER NOT NULL DEFAULT 1, -- Number of stories included per billing period
  is_active BOOLEAN DEFAULT true NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL, -- Order for display in UI
  features JSONB, -- Optional: plan features/benefits
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_display_order ON subscription_plans(display_order);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_type ON subscription_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price_id ON subscription_plans(stripe_price_id);

-- Add comments
COMMENT ON TABLE subscription_plans IS 'Available payment plans (one-time purchases and subscriptions). Plans are fetched dynamically from API.';
COMMENT ON COLUMN subscription_plans.billing_interval IS 'Billing interval for subscriptions: week, month, or year. NULL for one-time purchases.';
COMMENT ON COLUMN subscription_plans.stories_per_period IS 'Number of stories included per billing period (e.g., 1 per month, 2 per month, 1 per week).';

