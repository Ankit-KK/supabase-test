-- Fix: Secure masked views for user_signups table
-- These views should only be accessible by service role, not public

-- Revoke all access from anon and authenticated roles on masked views
REVOKE ALL ON user_signups_masked FROM anon;
REVOKE ALL ON user_signups_masked FROM authenticated;
REVOKE ALL ON user_signups_secure FROM anon;
REVOKE ALL ON user_signups_secure FROM authenticated;

-- Ensure only service_role can access these views
GRANT SELECT ON user_signups_masked TO service_role;
GRANT SELECT ON user_signups_secure TO service_role;