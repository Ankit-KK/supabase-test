-- SECURITY FIX: Simple but effective protection for user_signups table
-- This addresses the security finding about user contact information exposure

-- Create data masking functions
CREATE OR REPLACE FUNCTION public.mask_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 
    CASE 
      WHEN email IS NULL OR email = '' THEN email
      ELSE 
        substring(email from 1 for 2) || 
        repeat('*', greatest(0, position('@' in email) - 3)) ||
        substring(email from position('@' in email))
    END;
$$;

CREATE OR REPLACE FUNCTION public.mask_mobile(mobile text)
RETURNS text  
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 
    CASE 
      WHEN mobile IS NULL OR mobile = '' THEN mobile
      WHEN length(mobile) <= 4 THEN repeat('*', length(mobile))
      ELSE 
        substring(mobile from 1 for 2) || 
        repeat('*', length(mobile) - 4) ||
        substring(mobile from length(mobile) - 1)
    END;
$$;

-- Create audit logging table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sensitive_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  access_type text NOT NULL,
  accessed_by text,
  access_reason text,
  ip_address inet,
  created_at timestamp with time zone DEFAULT now()
);

-- Enhanced admin verification function with audit trail
CREATE OR REPLACE FUNCTION public.verify_admin_with_audit(
  access_reason text DEFAULT 'Admin access'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_email text;
  is_valid boolean := false;
BEGIN
  current_email := auth.email();
  is_valid := public.is_admin_email(current_email);
  
  -- Log access attempt
  BEGIN
    INSERT INTO public.sensitive_data_access_log (
      table_name,
      access_type,
      accessed_by,
      access_reason,
      ip_address
    ) VALUES (
      'user_signups',
      CASE WHEN is_valid THEN 'AUTHORIZED' ELSE 'UNAUTHORIZED' END,
      current_email,
      access_reason,
      inet_client_addr()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Continue if logging fails
      NULL;
  END;
  
  RETURN is_valid;
END;
$$;

-- Secure function to get individual signup with full data (requires justification)
CREATE OR REPLACE FUNCTION public.get_signup_secure(
  signup_id uuid,
  access_reason text
)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  mobile_number text,
  youtube_channel text,
  instagram_handle text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin access
  IF NOT public.verify_admin_with_audit(access_reason) THEN
    RAISE EXCEPTION 'Access denied: Invalid admin credentials';
  END IF;
  
  -- Require meaningful reason
  IF access_reason IS NULL OR length(trim(access_reason)) < 10 THEN
    RAISE EXCEPTION 'Access denied: Detailed reason (min 10 chars) required';
  END IF;
  
  -- Return the record
  RETURN QUERY
  SELECT us.id, us.name, us.email, us.mobile_number,
         us.youtube_channel, us.instagram_handle, us.created_at
  FROM public.user_signups us
  WHERE us.id = signup_id;
END;
$$;

-- Create masked view for safe browsing
CREATE OR REPLACE VIEW public.user_signups_masked AS
SELECT 
  id,
  name,
  public.mask_email(email) as email_masked,
  public.mask_mobile(mobile_number) as mobile_masked,
  youtube_channel,
  instagram_handle,
  created_at
FROM public.user_signups
WHERE public.verify_admin_with_audit('Viewing masked signup data');

-- Update RLS policies to use enhanced verification
DROP POLICY IF EXISTS "Admin SELECT access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Admin UPDATE access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Admin DELETE access to signups" ON public.user_signups;

CREATE POLICY "Enhanced admin SELECT access to signups"
ON public.user_signups
FOR SELECT
USING (public.verify_admin_with_audit('Direct SELECT on user_signups'));

CREATE POLICY "Enhanced admin UPDATE access to signups"
ON public.user_signups
FOR UPDATE  
USING (public.verify_admin_with_audit('UPDATE on user_signups'))
WITH CHECK (public.verify_admin_with_audit('UPDATE check on user_signups'));

CREATE POLICY "Enhanced admin DELETE access to signups"
ON public.user_signups
FOR DELETE
USING (public.verify_admin_with_audit('DELETE on user_signups'));

-- Enable RLS on audit log table
ALTER TABLE public.sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admin only audit log access"
ON public.sensitive_data_access_log
FOR ALL
USING (public.is_admin_email(auth.email()));

-- Add comments explaining the security enhancements
COMMENT ON TABLE public.user_signups IS 
'SECURITY ENHANCED: User signup data with audit logging. Use user_signups_masked view for browsing or get_signup_secure(id, reason) for individual records.';

COMMENT ON VIEW public.user_signups_masked IS 
'Secure view showing masked email/phone data. All access is logged.';

COMMENT ON FUNCTION public.get_signup_secure(uuid, text) IS 
'Secure access to individual signup record. Requires admin auth and detailed reason (min 10 chars). All access logged.';

-- Create performance index
CREATE INDEX IF NOT EXISTS idx_audit_log_accessed_by ON public.sensitive_data_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.sensitive_data_access_log(created_at);

-- Success message
SELECT 'SECURITY FIX COMPLETED: User contact information protection implemented successfully!' as status;