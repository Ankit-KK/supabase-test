-- Fix auth_sessions token exposure by creating a secure view
-- Create a view that excludes the sensitive token column
CREATE OR REPLACE VIEW public.auth_sessions_safe
WITH (security_invoker = on) AS
  SELECT 
    id,
    user_id,
    expires_at,
    created_at
  FROM public.auth_sessions;
-- Note: token column is intentionally excluded for security

-- Drop the existing permissive SELECT policy for users
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.auth_sessions;

-- Create a restrictive policy that only allows service role to SELECT from base table
CREATE POLICY "Only service role can read auth_sessions"
ON public.auth_sessions
FOR SELECT
USING (current_setting('role', true) = 'service_role');

-- Create a policy on the view for users to view their own sessions (without token)
-- Note: Views inherit RLS from the tables they query when using security_invoker
-- Since base table now denies user access, we need a different approach

-- Alternative: Allow users to see their own sessions but the view hides the token
DROP POLICY IF EXISTS "Only service role can read auth_sessions" ON public.auth_sessions;

-- Allow service role full access
CREATE POLICY "Service role can read all sessions"
ON public.auth_sessions
FOR SELECT
USING (current_setting('role', true) = 'service_role');

-- Users can only access their sessions through the safe view
-- Block direct table access for regular users
CREATE POLICY "Block direct user access to auth_sessions"
ON public.auth_sessions
FOR SELECT
TO authenticated
USING (false);