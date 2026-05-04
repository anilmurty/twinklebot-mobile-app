-- Captures request-context for new signups (IP, geo, user-agent, source LP)
-- so the new-user webhook can include it in admin alerts. Audit log path
-- on Supabase didn't yield this data reliably; capturing client-side is
-- more reliable and stays under our control.

CREATE TABLE IF NOT EXISTS public.signup_diagnostics (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address   text,
  country      text,
  region       text,
  city         text,
  user_agent   text,
  ua_summary   text,
  lp_source    text,
  referrer     text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signup_diagnostics_created_at_idx
  ON public.signup_diagnostics (created_at DESC);

ALTER TABLE public.signup_diagnostics ENABLE ROW LEVEL SECURITY;

-- No client-facing policies: only service_role reads/writes.
REVOKE ALL ON public.signup_diagnostics FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.signup_diagnostics TO service_role;
