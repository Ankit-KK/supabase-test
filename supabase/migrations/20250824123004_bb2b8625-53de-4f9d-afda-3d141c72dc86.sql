-- Fix the function search path security warning
-- Update the is_admin_user function to have a proper search path
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT auth.uid() IN (
    -- Add your admin user IDs here
    -- Example: '123e4567-e89b-12d3-a456-426614174000'::uuid
    -- For now, we'll make it restrictive - only allow if explicitly configured
    SELECT NULL::uuid WHERE FALSE
  );
$$;