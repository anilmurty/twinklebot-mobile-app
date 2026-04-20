-- Reduce early access signup grant from 4 credits to 1 credit.
-- Only affects NEW signups — existing users keep their current balances.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, premium_credits)
  VALUES (NEW.id, NEW.email, 1)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
