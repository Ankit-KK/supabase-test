-- Fix rate limiting security vulnerability: Restrict access to system processes only

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can manage rate limits" ON public.rate_limits;

-- Add restrictive policies that only allow service role access
CREATE POLICY "Service role can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

-- Allow SECURITY DEFINER functions to access (they run with elevated privileges)
-- This policy allows the check_rate_limit and check_server_rate_limit functions to work
CREATE POLICY "Security definer functions can access rate limits" 
ON public.rate_limits 
FOR ALL 
USING (current_setting('is_superuser') = 'on' OR current_setting('role') = 'service_role');

-- Log security fix
INSERT INTO public.audit_logs (action, table_name, user_email, ip_address, user_agent)
VALUES (
  'SECURITY_FIX', 
  'rate_limits', 
  'system@lovable.dev',
  'system',
  'Lovable Security Scanner - Fixed public access to rate limiting system'
);