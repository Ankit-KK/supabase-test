-- Fix critical security vulnerability: Infinite recursion in admin_emails RLS policies
-- The issue: is_current_user_admin() queries admin_emails, but admin_emails RLS policy calls is_current_user_admin()
-- This creates infinite recursion, making the table unprotected

-- Step 1: Create a secure admin check that doesn't depend on admin_emails table
-- We'll use a hardcoded approach initially, then provide a secure way to manage admins

-- Drop the problematic function that causes recursion
DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- Create a new secure admin check function that doesn't query admin_emails directly
-- This breaks the recursion by using a different approach
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- For now, we'll use a secure approach with service role detection
  -- In production, you should replace this with your actual admin email(s)
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

-- Step 2: Create a secure function to check if current user can access admin_emails
-- This function will be used by the RLS policies
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

-- Step 3: Update the RLS policies to use the new secure function
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can manage admin emails" ON public.admin_emails;

-- Create new secure policies that don't cause recursion
CREATE POLICY "Secure admin email access" 
ON public.admin_emails 
FOR ALL 
TO authenticated
USING (public.can_access_admin_emails())
WITH CHECK (public.can_access_admin_emails());

-- Step 4: Ensure no public access to admin_emails
-- Add explicit policy to deny anonymous access
CREATE POLICY "Deny anonymous access to admin emails"
ON public.admin_emails
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Step 5: Log the security fix
INSERT INTO public.audit_logs (
  user_email,
  action,
  table_name,
  ip_address,
  user_agent
) VALUES (
  'system-security-fix',
  'SECURITY_FIX: Fixed infinite recursion in admin_emails RLS policies',
  'admin_emails',
  NULL,
  'security-migration'
);

-- Step 6: Create a secure function for admins to manage admin emails
-- This function can only be called by service role or configured admins
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
  ON CONFLICT (email) DO NOTHING;
  
  -- Log the action
  PERFORM public.log_security_violation(
    'ADMIN_EMAIL_ADDED',
    'New admin email added: ' || new_admin_email,
    auth.email()
  );
END;
$$;

-- Step 7: Create function to remove admin emails
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
  IF lower(trim(remove_email)) = lower(auth.email()) THEN
    RAISE EXCEPTION 'Cannot remove your own admin email to prevent lockout';
  END IF;
  
  -- Remove the admin email
  DELETE FROM public.admin_emails 
  WHERE lower(email) = lower(trim(remove_email));
  
  -- Log the action
  PERFORM public.log_security_violation(
    'ADMIN_EMAIL_REMOVED',
    'Admin email removed: ' || remove_email,
    auth.email()
  );
END;
$$;