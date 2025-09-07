-- Fix conflicting RLS policies on user_signups table for maximum security

-- Drop ALL existing policies to start clean
DROP POLICY IF EXISTS "Deny all public access to user signups" ON public.user_signups;
DROP POLICY IF EXISTS "Admins can read user signups" ON public.user_signups;
DROP POLICY IF EXISTS "Admins can update user signups" ON public.user_signups;
DROP POLICY IF EXISTS "Admins can delete user signups" ON public.user_signups;
DROP POLICY IF EXISTS "Anonymous validated signup only" ON public.user_signups;
DROP POLICY IF EXISTS "Authenticated users cannot directly insert signups" ON public.user_signups;

-- Create a clean, non-conflicting policy structure

-- 1. Allow anonymous users to INSERT signups only (for signup form)
CREATE POLICY "Allow anonymous signup creation" 
ON public.user_signups 
FOR INSERT 
TO anon
WITH CHECK (
  -- Strict validation for customer data protection
  name IS NOT NULL AND 
  LENGTH(TRIM(name)) BETWEEN 1 AND 100 AND
  email IS NOT NULL AND 
  LENGTH(TRIM(email)) BETWEEN 5 AND 255 AND
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND -- Stricter email validation
  mobile_number IS NOT NULL AND 
  LENGTH(TRIM(mobile_number)) BETWEEN 8 AND 20 AND
  mobile_number ~ '^[0-9+\-\s\(\)]+$'
);

-- 2. DENY all other operations for anonymous users
CREATE POLICY "Deny anonymous access to existing signups" 
ON public.user_signups 
FOR SELECT, UPDATE, DELETE
TO anon
USING (false);

-- 3. DENY all operations for regular authenticated users 
CREATE POLICY "Deny authenticated user access to signups" 
ON public.user_signups 
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- 4. Allow ONLY admin users full access (overrides the deny policies above)
CREATE POLICY "Admin full access to user signups" 
ON public.user_signups 
FOR ALL
TO authenticated
USING (is_admin_email(auth.email()))
WITH CHECK (is_admin_email(auth.email()));

-- Verify RLS is enabled
ALTER TABLE public.user_signups ENABLE ROW LEVEL SECURITY;

-- Log security fix
INSERT INTO public.audit_logs (action, table_name, user_email, ip_address, user_agent)
VALUES (
  'SECURITY_FIX', 
  'user_signups', 
  'system@lovable.dev',
  'system',
  'Lovable Security Scanner - Resolved conflicting RLS policies for customer data protection'
);