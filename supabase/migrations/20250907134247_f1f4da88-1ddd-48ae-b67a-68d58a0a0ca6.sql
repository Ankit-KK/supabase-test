-- SECURITY FIX: Enhanced protection for user_signups table (Incremental Fix)
-- This addresses the security finding about user contact information exposure

-- Drop existing policies if they exist to recreate them with enhanced security
DROP POLICY IF EXISTS "Super admin only access to audit logs" ON public.sensitive_data_access_log;
DROP POLICY IF EXISTS "Admin SELECT access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Admin UPDATE access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Admin DELETE access to signups" ON public.user_signups;

-- Step 1: Create data masking functions (safe to recreate)
CREATE OR REPLACE FUNCTION public.mask_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
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
SET search_path TO 'public'
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

-- Step 2: Ensure audit table exists with proper structure
CREATE TABLE IF NOT EXISTS public.sensitive_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  access_type text NOT NULL,
  accessed_by text,
  access_reason text,
  ip_address inet,
  user_agent text,
  session_info jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

-- Create secure policy for audit log
CREATE POLICY "Secure audit log access"
ON public.sensitive_data_access_log
FOR ALL
USING (
  -- Only allow access to super admins (update these emails as needed)
  auth.email() IN (
    'admin@yourdomain.com',
    'security@yourdomain.com'
  ) OR public.is_admin_email(auth.email())
);

-- Step 3: Enhanced admin verification with audit trail
CREATE OR REPLACE FUNCTION public.verify_admin_access_with_audit(
  access_reason text DEFAULT 'Admin dashboard access',
  table_name text DEFAULT 'user_signups'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_email text;
  is_valid_admin boolean := false;
BEGIN
  current_email := auth.email();
  is_valid_admin := public.is_admin_email(current_email);
  
  -- Log all access attempts
  BEGIN
    INSERT INTO public.sensitive_data_access_log (
      table_name,
      access_type,
      accessed_by,
      access_reason,
      ip_address,
      session_info
    ) VALUES (
      table_name,
      CASE WHEN is_valid_admin THEN 'AUTHORIZED_ACCESS' ELSE 'UNAUTHORIZED_ATTEMPT' END,
      current_email,
      access_reason,
      inet_client_addr(),
      jsonb_build_object(
        'timestamp', now(),
        'auth_uid', auth.uid(),
        'admin_verified', is_valid_admin
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- If logging fails, still allow the function to continue but log security violation
      PERFORM public.log_security_violation('AUDIT_LOG_FAILURE', 'Failed to log access attempt: ' || SQLERRM);
  END;
  
  RETURN is_valid_admin;
END;
$$;

-- Step 4: Create secure view with masked data
CREATE OR REPLACE VIEW public.user_signups_secure AS
SELECT 
  id,
  name,
  public.mask_email(email) as email_masked,
  public.mask_mobile(mobile_number) as mobile_masked,
  youtube_channel,
  instagram_handle,
  created_at,
  true as is_masked_data
FROM public.user_signups
WHERE public.verify_admin_access_with_audit('Viewing masked user signups', 'user_signups');

-- Step 5: Secure function for full data access
CREATE OR REPLACE FUNCTION public.get_user_signup_full(
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
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify admin access
  IF NOT public.verify_admin_access_with_audit(
    COALESCE(access_reason, 'Individual record access'),
    'user_signups'
  ) THEN
    RAISE EXCEPTION 'Access denied: Invalid admin credentials';
  END IF;
  
  -- Require meaningful reason
  IF access_reason IS NULL OR length(trim(access_reason)) < 10 THEN
    RAISE EXCEPTION 'Access denied: Detailed access reason (min 10 chars) required';
  END IF;
  
  -- Log specific record access
  BEGIN
    INSERT INTO public.sensitive_data_access_log (
      table_name,
      record_id,
      access_type,
      accessed_by,
      access_reason,
      ip_address
    ) VALUES (
      'user_signups',
      signup_id,
      'FULL_DATA_ACCESS',
      auth.email(),
      access_reason,
      inet_client_addr()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Continue even if logging fails
      NULL;
  END;
  
  -- Return the record
  RETURN QUERY
  SELECT 
    us.id, us.name, us.email, us.mobile_number,
    us.youtube_channel, us.instagram_handle, us.created_at
  FROM public.user_signups us
  WHERE us.id = signup_id;
END;
$$;

-- Step 6: Create new secure RLS policies for user_signups
CREATE POLICY "Secure admin access to signups"
ON public.user_signups
FOR SELECT
USING (
  public.verify_admin_access_with_audit(
    'Direct admin access to user_signups - consider using user_signups_secure view',
    'user_signups'
  )
);

CREATE POLICY "Secure admin update to signups"
ON public.user_signups
FOR UPDATE
USING (
  public.verify_admin_access_with_audit('Admin UPDATE on user_signups', 'user_signups')
)
WITH CHECK (
  public.verify_admin_access_with_audit('Admin UPDATE check on user_signups', 'user_signups')
);

CREATE POLICY "Secure admin delete to signups"
ON public.user_signups
FOR DELETE
USING (
  public.verify_admin_access_with_audit('Admin DELETE on user_signups', 'user_signups')
);

-- Step 7: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_sensitive_access_log_accessed_by 
ON public.sensitive_data_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_sensitive_access_log_created_at 
ON public.sensitive_data_access_log(created_at);
CREATE INDEX IF NOT EXISTS idx_sensitive_access_log_access_type 
ON public.sensitive_data_access_log(access_type);

-- Step 8: Add security documentation
COMMENT ON TABLE public.user_signups IS 
'User signup data with enhanced security protection:
- Direct access is logged and requires admin verification
- Use user_signups_secure view for masked data browsing
- Use get_user_signup_full(id, reason) for individual full records
- All access attempts are logged in sensitive_data_access_log';

COMMENT ON VIEW public.user_signups_secure IS 
'Masked view of user signups (email/phone obscured) for regular admin browsing. All access is logged.';

-- Final notice
SELECT 'SECURITY FIX APPLIED: User contact information is now protected with:
- Enhanced RLS policies requiring admin verification
- Comprehensive audit logging of all access attempts  
- Data masking functions for email/phone display
- Secure functions requiring access justification
- IP address tracking for all sensitive data access

RECOMMENDED: Use user_signups_secure view for regular admin operations.' as security_status;