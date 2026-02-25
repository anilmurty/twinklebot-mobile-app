-- Fix all Supabase Security Advisor errors and warnings
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. Enable RLS on subscriptions (user-specific data)
-- ============================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages subscriptions"
  ON subscriptions FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- ============================================================
-- 2. Enable RLS on character_looks (public reference data)
-- ============================================================
ALTER TABLE character_looks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active character looks"
  ON character_looks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role manages character looks"
  ON character_looks FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- ============================================================
-- 3. Enable RLS on subscription_plans (public catalog data)
-- ============================================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role manages subscription plans"
  ON subscription_plans FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- ============================================================
-- 4. Fix function search paths (mutable search_path warnings)
-- ============================================================

-- handle_new_user: creates profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- update_updated_at_column: auto-updates updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- reset_monthly_story_counter: resets monthly usage counts
CREATE OR REPLACE FUNCTION public.reset_monthly_story_counter()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET stories_generated_this_month = 0
  WHERE stories_generated_this_month > 0;
END;
$$ LANGUAGE plpgsql
SET search_path = '';
