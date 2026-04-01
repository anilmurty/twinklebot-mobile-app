-- Grant 4 premium credits to all new signups during early access period.
-- Drop this trigger when early access ends.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, premium_credits)
  VALUES (NEW.id, NEW.email, 4)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger on_auth_user_created already exists from migration 005,
-- it will now use the updated function automatically.
