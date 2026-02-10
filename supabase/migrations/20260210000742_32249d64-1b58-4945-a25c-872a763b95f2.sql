
-- Block anon access to auth_sessions base table
-- The auth_sessions_safe view uses security_invoker, so blocking anon on the base table
-- will prevent anonymous users from reading session data through the view
CREATE POLICY "Block anon access to auth_sessions"
ON public.auth_sessions
FOR SELECT
TO anon
USING (false);
