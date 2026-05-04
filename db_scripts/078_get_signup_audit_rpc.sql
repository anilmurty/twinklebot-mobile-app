-- RPC for the new-user webhook to enrich signup notifications with the IP /
-- user-agent of the signup request.
--
-- Reads from auth.audit_log_entries, which the service role would otherwise
-- need direct schema access to query. SECURITY DEFINER lets us expose just
-- this narrow read without granting broader auth-schema privileges.

CREATE OR REPLACE FUNCTION public.get_signup_audit(p_user_id uuid)
RETURNS TABLE (
  ip_address text,
  user_agent text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    ale.ip_address::text                      AS ip_address,
    COALESCE(
      ale.payload->>'user_agent',
      ale.payload->'metadata'->>'user_agent'
    )                                         AS user_agent,
    ale.created_at                            AS created_at
  FROM auth.audit_log_entries ale
  WHERE
    (ale.payload->'traits'->>'user_id')::text = p_user_id::text
    OR (ale.payload->>'actor_id')::text       = p_user_id::text
  ORDER BY ale.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_signup_audit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_signup_audit(uuid) TO service_role;
