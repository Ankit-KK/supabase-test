-- Revoke all access from anon and authenticated on these views
-- Views with security_invoker=on inherit base table RLS, but revoking
-- SELECT ensures no access even if base table policies change
REVOKE ALL ON auth_sessions_safe FROM anon, authenticated;
REVOKE ALL ON user_signups_masked FROM anon, authenticated;
REVOKE ALL ON user_signups_secure FROM anon, authenticated;