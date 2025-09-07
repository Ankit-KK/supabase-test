-- Fix duplicate policies and ensure maximum security for customer personal information

-- Remove the duplicate/legacy admin view policy  
DROP POLICY IF EXISTS "Only admins can view user signups" ON public.user_signups;

-- Add explicit deny-all policy for any missed cases
CREATE POLICY "Deny all public access to user signups" 
ON public.user_signups 
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Recreate admin policies with higher priority (they come after the deny-all)
DROP POLICY IF EXISTS "Admin read access to user signups" ON public.user_signups;
DROP POLICY IF EXISTS "Admin update access to user signups" ON public.user_signups;  
DROP POLICY IF EXISTS "Admin delete access to user signups" ON public.user_signups;

CREATE POLICY "Admins can read user signups" 
ON public.user_signups 
FOR SELECT 
TO authenticated
USING (is_admin_email(auth.email()));

CREATE POLICY "Admins can update user signups" 
ON public.user_signups 
FOR UPDATE 
TO authenticated
USING (is_admin_email(auth.email()))
WITH CHECK (is_admin_email(auth.email()));

CREATE POLICY "Admins can delete user signups" 
ON public.user_signups 
FOR DELETE 
TO authenticated
USING (is_admin_email(auth.email()));

-- Ensure anonymous insert policy is still working but secure
DROP POLICY IF EXISTS "Anonymous can only insert signups" ON public.user_signups;

CREATE POLICY "Anonymous validated signup only" 
ON public.user_signups 
FOR INSERT 
TO anon
WITH CHECK (
  -- Strict validation for anonymous signups
  name IS NOT NULL AND 
  LENGTH(TRIM(name)) BETWEEN 1 AND 100 AND
  email IS NOT NULL AND 
  LENGTH(TRIM(email)) BETWEEN 5 AND 255 AND
  email ~* '^[^@]+@[^@]+\.[^@]+$' AND -- Basic email format validation
  mobile_number IS NOT NULL AND 
  LENGTH(TRIM(mobile_number)) BETWEEN 8 AND 20 AND
  mobile_number ~ '^[0-9+\-\s\(\)]+$' -- Only allow valid phone number characters
);

-- Log security enhancement
INSERT INTO public.audit_logs (action, table_name, user_email, ip_address, user_agent)
VALUES (
  'SECURITY_ENHANCEMENT', 
  'user_signups', 
  'system@lovable.dev',
  'system',
  'Lovable Security Scanner - Implemented strict deny-all policy with admin exceptions for customer data'
);