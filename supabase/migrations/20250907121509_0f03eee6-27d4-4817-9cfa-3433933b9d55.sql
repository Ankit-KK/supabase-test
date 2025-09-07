-- Fix customer contact information security vulnerability

-- The current policies are mostly correct, but we need to enhance security further

-- Drop the overly broad "Only admins can manage user signups" policy
DROP POLICY IF EXISTS "Only admins can manage user signups" ON public.user_signups;

-- Create more specific admin policies for better security control
CREATE POLICY "Admin read access to user signups" 
ON public.user_signups 
FOR SELECT 
USING (is_admin_email(auth.email()));

CREATE POLICY "Admin update access to user signups" 
ON public.user_signups 
FOR UPDATE 
USING (is_admin_email(auth.email()))
WITH CHECK (is_admin_email(auth.email()));

CREATE POLICY "Admin delete access to user signups" 
ON public.user_signups 
FOR DELETE 
USING (is_admin_email(auth.email()));

-- Enhance the anonymous signup policy to be more restrictive
DROP POLICY IF EXISTS "Allow anonymous signups only" ON public.user_signups;

CREATE POLICY "Anonymous can only insert signups" 
ON public.user_signups 
FOR INSERT 
TO anon
WITH CHECK (
  -- Additional validation: ensure data is not empty and within reasonable limits
  name IS NOT NULL AND LENGTH(TRIM(name)) > 0 AND LENGTH(name) <= 100 AND
  email IS NOT NULL AND LENGTH(TRIM(email)) > 0 AND LENGTH(email) <= 255 AND
  mobile_number IS NOT NULL AND LENGTH(TRIM(mobile_number)) > 0 AND LENGTH(mobile_number) <= 20
);

-- Add a deny-all policy for authenticated users trying to insert (they should use proper signup flow)
CREATE POLICY "Authenticated users cannot directly insert signups" 
ON public.user_signups 
FOR INSERT 
TO authenticated
WITH CHECK (false);

-- Log security fix
INSERT INTO public.audit_logs (action, table_name, user_email, ip_address, user_agent)
VALUES (
  'SECURITY_FIX', 
  'user_signups', 
  'system@lovable.dev',
  'system',
  'Lovable Security Scanner - Enhanced protection for customer contact information'
);