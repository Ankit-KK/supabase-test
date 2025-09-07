-- Fix privacy issue: Restrict visits table read access to admins only

-- Drop the public read access policy
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.visits;

-- Add admin-only read access policy
CREATE POLICY "Admin only read access to visits" 
ON public.visits 
FOR SELECT 
USING (is_admin_user());

-- Log security fix
INSERT INTO public.audit_logs (action, table_name, user_email, ip_address, user_agent)
VALUES (
  'SECURITY_FIX', 
  'visits', 
  'system@lovable.dev',
  'system',
  'Lovable Security Scanner - Fixed public access to visitor IP addresses'
);