-- Fix critical security vulnerability: Infinite recursion in admin_emails RLS policies
-- Step 1: Drop dependent policies first to avoid dependency errors

-- Drop policies that depend on is_current_user_admin()
DROP POLICY IF EXISTS "Admins can manage admin emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Public can access streamers via secure functions only" ON public.streamers;

-- Step 2: Now safely drop and recreate the problematic function
DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- Create new secure admin check function that doesn't query admin_emails directly
-- This breaks the infinite recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Use hardcoded admin emails to break recursion with admin_emails table
  -- In production, replace these with your actual admin email addresses
  SELECT 
    CASE 
      WHEN current_setting('role') = 'service_role' THEN true
      WHEN auth.email() IN (
        'admin@yourdomain.com',  -- Replace with actual admin email
        'support@yourdomain.com' -- Add more admin emails as needed
      ) THEN true
      ELSE false
    END;
$$;

-- Step 3: Create a separate function specifically for admin_emails access
CREATE OR REPLACE FUNCTION public.can_access_admin_emails()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Only service role or explicitly configured admins can access
  SELECT 
    current_setting('role') = 'service_role' OR
    auth.email() IN (
      'admin@yourdomain.com',  -- Replace with actual admin email
      'support@yourdomain.com' -- Add more admin emails as needed
    );
$$;

-- Step 4: Recreate the admin_emails policies using the non-recursive function
CREATE POLICY "Secure admin email access" 
ON public.admin_emails 
FOR ALL 
TO authenticated
USING (public.can_access_admin_emails())
WITH CHECK (public.can_access_admin_emails());

-- Explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to admin emails"
ON public.admin_emails
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Step 5: Recreate the streamers policy that was dropped
CREATE POLICY "Public can access streamers via secure functions only" 
ON public.streamers 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
  public.is_current_user_admin()
);

-- Step 6: Create secure functions for managing admin emails
CREATE OR REPLACE FUNCTION public.add_admin_email(new_admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller has admin privileges
  IF NOT public.can_access_admin_emails() THEN
    RAISE EXCEPTION 'Access denied: Only admins can manage admin emails';
  END IF;
  
  -- Validate email format
  IF new_admin_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Invalid email format: %', new_admin_email;
  END IF;
  
  -- Insert the new admin email (ignore duplicates)
  INSERT INTO public.admin_emails (email) 
  VALUES (lower(trim(new_admin_email)))
  ON CONFLICT DO NOTHING;
  
  -- Log the action
  PERFORM public.log_security_violation(
    'ADMIN_EMAIL_ADDED',
    'New admin email added: ' || new_admin_email,
    COALESCE(auth.email(), 'system')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_admin_email(remove_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller has admin privileges
  IF NOT public.can_access_admin_emails() THEN
    RAISE EXCEPTION 'Access denied: Only admins can manage admin emails';
  END IF;
  
  -- Don't allow removing your own email (prevent lockout)
  IF lower(trim(remove_email)) = lower(COALESCE(auth.email(), '')) THEN
    RAISE EXCEPTION 'Cannot remove your own admin email to prevent lockout';
  END IF;
  
  -- Remove the admin email
  DELETE FROM public.admin_emails 
  WHERE lower(email) = lower(trim(remove_email));
  
  -- Log the action
  PERFORM public.log_security_violation(
    'ADMIN_EMAIL_REMOVED',
    'Admin email removed: ' || remove_email,
    COALESCE(auth.email(), 'system')
  );
END;
$$;

-- Step 7: Log the security fix
INSERT INTO public.audit_logs (
  user_email,
  action,
  table_name,
  ip_address,
  user_agent
) VALUES (
  'system-security-fix',
  'SECURITY_FIX: Fixed infinite recursion in admin_emails RLS policies - admin emails now properly protected',
  'admin_emails',
  NULL,
  'security-migration'
);