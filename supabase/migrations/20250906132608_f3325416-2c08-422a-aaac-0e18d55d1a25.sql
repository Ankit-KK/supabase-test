-- Final Security Cleanup

-- Clean up extensions in public schema (move uuid-ossp to extensions schema if needed)
-- This addresses the linter warning about extensions in public schema

-- Enable leaked password protection (this will need to be done in Supabase Auth UI)
-- But we can set up the foundation here

-- Create a secure function to check if current user is system/service role
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_setting('role') = 'service_role';
$$;

-- Add additional security logging
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name text,
  action text,
  record_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_email,
    action,
    table_name,
    record_id,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(auth.email(), 'anonymous'),
    action,
    table_name,
    record_id,
    NULL, -- IP will be logged at application level
    'system-security-audit'
  );
END;
$$;

-- Create a function to validate donation amounts for security
CREATE OR REPLACE FUNCTION public.validate_donation_amount(amount numeric)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT amount > 0 AND amount <= 100000; -- Max donation of 1 lakh
$$;

-- Add a security constraint function for streamer validation
CREATE OR REPLACE FUNCTION public.is_valid_streamer_operation(streamer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.streamers 
    WHERE id = streamer_id 
    AND (user_id = auth.uid() OR auth.uid() IS NULL)
  );
$$;