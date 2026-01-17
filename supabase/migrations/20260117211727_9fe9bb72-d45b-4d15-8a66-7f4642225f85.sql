-- Fix admin email list exposure vulnerability
-- Only allow checking if an email IS admin, but prevent listing ALL admin emails

-- Drop existing SELECT policy that allows admins to see all admin emails
DROP POLICY IF EXISTS "Only admins can view admin emails" ON public.admin_emails;

-- Create a new restrictive policy that only allows service_role to list admin emails
-- Individual admins can only see their own email entry (needed for confirmation they are admin)
CREATE POLICY "Admins can only view own email entry"
ON public.admin_emails
FOR SELECT
TO authenticated
USING (
  -- Service role can see all (for backend operations)
  current_setting('role', true) = 'service_role'
  OR
  -- Authenticated users can only see their own email entry
  (email = auth.email() AND is_admin_email(auth.email()))
);

-- Add comment explaining the security rationale
COMMENT ON TABLE public.admin_emails IS 'Admin email list. Individual admins can only verify their own admin status, not list all admins. Full list only accessible via service_role.';

-- Ensure the is_admin_email function is SECURITY DEFINER to allow checking admin status
-- without exposing the full list
CREATE OR REPLACE FUNCTION public.is_admin_email(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails 
    WHERE lower(email) = lower(check_email)
  );
$$;

-- Revoke direct execute on is_admin_email from public to prevent enumeration attacks
-- Only authenticated users should be able to check admin status
REVOKE EXECUTE ON FUNCTION public.is_admin_email(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_email(TEXT) TO service_role;