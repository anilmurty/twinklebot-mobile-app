-- Track the total premium credits ever granted to each user (signup grants + admin grants).
-- Purchased credits (via Stripe/IAP) are NOT counted here — this measures free/gift credits only.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS premium_credits_granted INTEGER NOT NULL DEFAULT 0;

-- Backfill: assume existing users' current balance equals their total grants
-- (they predate purchases in the new Stripe account).
UPDATE profiles
SET premium_credits_granted = GREATEST(premium_credits, 0)
WHERE premium_credits_granted = 0;

-- Update the new-signup trigger to track the grant.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, premium_credits, premium_credits_granted)
  VALUES (NEW.id, NEW.email, 1, 1)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
