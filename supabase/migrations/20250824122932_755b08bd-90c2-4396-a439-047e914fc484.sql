-- Fix security vulnerability in audit_logs table
-- Remove the overly permissive policy that allows all authenticated users to view audit logs
DROP POLICY IF EXISTS "Allow authenticated users to view audit logs" ON public.audit_logs;

-- Create a security definer function to check if user is admin
-- For now, we'll use a simple approach - you can modify this list of admin user IDs as needed
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid() IN (
    -- Add your admin user IDs here
    -- Example: '123e4567-e89b-12d3-a456-426614174000'::uuid
    -- For now, we'll make it restrictive - only allow if explicitly configured
    SELECT NULL::uuid WHERE FALSE
  );
$$;

-- Create admin-only policy for viewing audit logs
CREATE POLICY "Admin only access to audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (public.is_admin_user());

-- Keep the existing insert policy for system logging
-- No changes needed for "Allow system to insert audit logs" policy