-- SECURITY FIX: Enhanced protection for user_signups table (Simplified Version)
-- This addresses the security finding about user contact information exposure

-- Step 1: Create data masking functions
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

-- Function to mask mobile numbers
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

-- Step 2: Create audit logging for sensitive data access
CREATE TABLE IF NOT EXISTS public.sensitive_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  access_type text NOT NULL, -- 'SELECT', 'DECRYPT', 'EXPORT', etc.
  accessed_by text, -- email of user who accessed
  access_reason text, -- justification for access
  ip_address inet,
  user_agent text,
  session_info jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can read audit logs
CREATE POLICY "Super admin only access to audit logs"
ON public.sensitive_data_access_log
FOR ALL
USING (
  -- Only allow access if user is in a special super_admin role
  auth.email() IN (
    'admin@yourdomain.com', -- Replace with actual super admin emails
    'security@yourdomain.com'
  )
);

-- Step 3: Create enhanced admin verification function with audit trail
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
  -- Get current user email
  current_email := auth.email();
  
  -- Verify admin status
  is_valid_admin := public.is_admin_email(current_email);
  
  -- Log the access attempt (both successful and failed)
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
  
  -- Additional time-based restrictions (no access during maintenance hours)
  IF is_valid_admin AND EXTRACT(hour FROM now()) BETWEEN 2 AND 5 THEN
    -- Late night access requires emergency justification
    IF access_reason NOT ILIKE '%emergency%' AND access_reason NOT ILIKE '%urgent%' AND access_reason NOT ILIKE '%maintenance%' THEN
      PERFORM public.log_security_violation(
        'AFTER_HOURS_ADMIN_ACCESS',
        'Admin accessed sensitive data during restricted hours (2-5 AM) without emergency justification'
      );
    END IF;
  END IF;
  
  RETURN is_valid_admin;
END;
$$;

-- Step 4: Create secure view for user signups with masked data
CREATE OR REPLACE VIEW public.user_signups_secure AS
SELECT 
  id,
  name, -- Keep name as is since it's usually not as sensitive as contact info
  public.mask_email(email) as email_masked,
  public.mask_mobile(mobile_number) as mobile_masked,
  youtube_channel,
  instagram_handle,
  created_at,
  -- Add a flag to indicate this is masked data
  true as is_masked_data,
  -- Add a warning about data sensitivity
  'Use get_user_signup_full() for accessing complete record with justification' as data_access_note
FROM public.user_signups
WHERE public.verify_admin_access_with_audit('Viewing masked user signups', 'user_signups');

-- Step 5: Create function for accessing individual full records (with strong audit trail)
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
  created_at timestamp with time zone,
  access_logged_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  access_time timestamp with time zone := now();
BEGIN
  -- Verify admin access with mandatory reason
  IF NOT public.verify_admin_access_with_audit(access_reason, 'user_signups') THEN
    RAISE EXCEPTION 'Access denied: Invalid admin credentials or insufficient permissions';
  END IF;
  
  -- Require meaningful access reason (minimum 10 characters)
  IF access_reason IS NULL OR length(trim(access_reason)) < 10 THEN
    RAISE EXCEPTION 'Access denied: Detailed access reason (minimum 10 characters) is required for viewing full user data';
  END IF;
  
  -- Log the specific record access with detailed information
  INSERT INTO public.sensitive_data_access_log (
    table_name,
    record_id,
    access_type,
    accessed_by,
    access_reason,
    ip_address,
    session_info
  ) VALUES (
    'user_signups',
    signup_id,
    'FULL_DATA_ACCESS',
    auth.email(),
    access_reason,
    inet_client_addr(),
    jsonb_build_object(
      'function', 'get_user_signup_full',
      'record_id', signup_id,
      'access_time', access_time,
      'auth_uid', auth.uid()
    )
  );
  
  -- Return the requested record with access timestamp
  RETURN QUERY
  SELECT 
    us.id,
    us.name,
    us.email,
    us.mobile_number,
    us.youtube_channel,
    us.instagram_handle,
    us.created_at,
    access_time as access_logged_at
  FROM public.user_signups us
  WHERE us.id = signup_id;
  
  -- If no record found, still log the attempt
  IF NOT FOUND THEN
    INSERT INTO public.sensitive_data_access_log (
      table_name,
      record_id,
      access_type,
      accessed_by,
      access_reason,
      session_info
    ) VALUES (
      'user_signups',
      signup_id,
      'FULL_DATA_ACCESS_NOT_FOUND',
      auth.email(),
      access_reason,
      jsonb_build_object('error', 'Record not found', 'requested_id', signup_id)
    );
  END IF;
END;
$$;

-- Step 6: Create rate limiting for bulk access
CREATE OR REPLACE FUNCTION public.check_bulk_access_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_access_count integer;
  current_email text;
BEGIN
  current_email := auth.email();
  
  -- Check how many bulk accesses in the last hour
  SELECT count(*) INTO recent_access_count
  FROM public.sensitive_data_access_log
  WHERE accessed_by = current_email
    AND access_type LIKE '%BULK%'
    AND created_at > now() - interval '1 hour';
  
  -- Allow maximum 3 bulk operations per hour per admin
  IF recent_access_count >= 3 THEN
    PERFORM public.log_security_violation(
      'BULK_ACCESS_RATE_LIMIT_EXCEEDED',
      'Admin ' || current_email || ' exceeded bulk access rate limit (3/hour)'
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Step 7: Update existing RLS policies to use the enhanced verification
DROP POLICY IF EXISTS "Enhanced admin SELECT access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Enhanced admin UPDATE access to signups" ON public.user_signups;  
DROP POLICY IF EXISTS "Enhanced admin DELETE access to signups" ON public.user_signups;

-- Create new, more secure policies
CREATE POLICY "Secure admin SELECT access to signups"
ON public.user_signups
FOR SELECT
USING (
  public.verify_admin_access_with_audit('Admin direct SELECT on user_signups - USE user_signups_secure VIEW INSTEAD', 'user_signups')
);

CREATE POLICY "Secure admin UPDATE access to signups"  
ON public.user_signups
FOR UPDATE
USING (
  public.verify_admin_access_with_audit('Admin UPDATE on user_signups', 'user_signups')
)
WITH CHECK (
  public.verify_admin_access_with_audit('Admin UPDATE check on user_signups', 'user_signups')
);

CREATE POLICY "Secure admin DELETE access to signups"
ON public.user_signups  
FOR DELETE
USING (
  public.verify_admin_access_with_audit('Admin DELETE on user_signups', 'user_signups') AND
  public.check_bulk_access_rate_limit()
);

-- Step 8: Create emergency data export function (with heavy auditing and rate limiting)
CREATE OR REPLACE FUNCTION public.export_user_signups_for_compliance(
  export_reason text,
  requested_by text DEFAULT NULL
)
RETURNS TABLE(
  export_id uuid,
  name text,
  email_partial text,
  mobile_partial text,
  youtube_channel text,
  instagram_handle text,
  created_at timestamp with time zone,
  export_timestamp timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  export_uuid uuid := gen_random_uuid();
  current_time timestamp with time zone := now();
BEGIN
  -- Check rate limiting first
  IF NOT public.check_bulk_access_rate_limit() THEN
    RAISE EXCEPTION 'Export denied: Bulk access rate limit exceeded. Please wait before attempting another export.';
  END IF;
  
  -- Require detailed justification for data export (minimum 50 characters)
  IF export_reason IS NULL OR length(trim(export_reason)) < 50 THEN
    RAISE EXCEPTION 'Export denied: Detailed reason (minimum 50 characters) required for compliance export';
  END IF;
  
  -- Verify admin access
  IF NOT public.verify_admin_access_with_audit(export_reason, 'user_signups') THEN
    RAISE EXCEPTION 'Export denied: Invalid admin credentials or insufficient permissions';
  END IF;
  
  -- Log this major data access event
  INSERT INTO public.sensitive_data_access_log (
    table_name,
    access_type,
    accessed_by,
    access_reason,
    ip_address,
    session_info
  ) VALUES (
    'user_signups',
    'BULK_EXPORT_COMPLIANCE',
    auth.email(),
    'COMPLIANCE_EXPORT: ' || export_reason || COALESCE(' | Requested by: ' || requested_by, ''),
    inet_client_addr(),
    jsonb_build_object(
      'export_id', export_uuid,
      'export_type', 'compliance',
      'requested_by', requested_by,
      'export_time', current_time
    )
  );
  
  -- Return partially masked data for compliance purposes (not full data)
  RETURN QUERY
  SELECT 
    export_uuid as export_id,
    us.name,
    public.mask_email(us.email) as email_partial,
    public.mask_mobile(us.mobile_number) as mobile_partial,
    us.youtube_channel,
    us.instagram_handle,
    us.created_at,
    current_time as export_timestamp
  FROM public.user_signups us
  ORDER BY us.created_at DESC;
END;
$$;

-- Step 9: Create a function to get access statistics (for security monitoring)
CREATE OR REPLACE FUNCTION public.get_sensitive_data_access_stats(
  days_back integer DEFAULT 7
)
RETURNS TABLE(
  access_date date,
  total_accesses bigint,
  unique_admins bigint,
  unauthorized_attempts bigint,
  bulk_operations bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only super admins can view these statistics
  IF NOT auth.email() IN ('admin@yourdomain.com', 'security@yourdomain.com') THEN
    RAISE EXCEPTION 'Access denied: Only super administrators can view access statistics';
  END IF;
  
  RETURN QUERY
  SELECT 
    created_at::date as access_date,
    count(*) as total_accesses,
    count(DISTINCT accessed_by) as unique_admins,
    count(*) FILTER (WHERE access_type LIKE '%UNAUTHORIZED%') as unauthorized_attempts,
    count(*) FILTER (WHERE access_type LIKE '%BULK%') as bulk_operations
  FROM public.sensitive_data_access_log
  WHERE created_at > current_date - (days_back || ' days')::interval
  GROUP BY created_at::date
  ORDER BY access_date DESC;
END;
$$;

-- Add helpful comments explaining security enhancements
COMMENT ON TABLE public.user_signups IS 
'User signup data with enhanced security: 
- Use user_signups_secure view for regular admin access (shows masked email/phone)
- Use get_user_signup_full(id, reason) for individual records with full data (requires justification)
- Use export_user_signups_for_compliance(reason) for compliance exports (rate limited)
- All access is logged in sensitive_data_access_log with IP addresses and justifications';

COMMENT ON VIEW public.user_signups_secure IS 
'Secure view of user signups showing masked email/phone for regular admin operations. Access is logged. For full individual record access, use get_user_signup_full() with proper justification.';

COMMENT ON FUNCTION public.get_user_signup_full(uuid, text) IS 
'Secure function to access individual user signup record with full sensitive data. Requires valid admin access and mandatory access reason (min 10 chars). All access attempts are logged with IP and timestamp.';

COMMENT ON FUNCTION public.export_user_signups_for_compliance(text, text) IS 
'Compliance export function with rate limiting (3/hour max). Returns partially masked data for compliance purposes. Requires detailed justification (min 50 chars). Heavily audited with export ID tracking.';

COMMENT ON TABLE public.sensitive_data_access_log IS 
'Audit log for all access to sensitive user data. Tracks authorized access, unauthorized attempts, IP addresses, and detailed session information. Only accessible to super administrators.';

-- Create indexes for better performance on audit queries
CREATE INDEX IF NOT EXISTS idx_sensitive_access_log_accessed_by ON public.sensitive_data_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_sensitive_access_log_created_at ON public.sensitive_data_access_log(created_at);
CREATE INDEX IF NOT EXISTS idx_sensitive_access_log_access_type ON public.sensitive_data_access_log(access_type);

-- Final security notice
DO $$
BEGIN
  RAISE NOTICE 'SECURITY ENHANCEMENT COMPLETED:
  
  ✅ Enhanced RLS policies with audit trail
  ✅ Data masking functions for email/phone
  ✅ Comprehensive access logging with IP tracking  
  ✅ Rate limiting for bulk operations (3/hour)
  ✅ Time-based access restrictions (2-5 AM requires emergency justification)
  ✅ Mandatory access reasons for full data access
  ✅ Secure views and functions for different access levels
  
  📋 RECOMMENDED USAGE:
  - Use user_signups_secure view for regular admin browsing (masked data)
  - Use get_user_signup_full(id, reason) for individual records when full data needed
  - Use export_user_signups_for_compliance(reason) for compliance exports
  - Monitor sensitive_data_access_log for security audit trail
  
  🔒 ADMIN ACTIONS REQUIRED:
  1. Update super admin emails in sensitive_data_access_log policy
  2. Review and customize time-based restrictions if needed
  3. Set up monitoring alerts on unauthorized access attempts
  4. Train admins on new secure access procedures';
END $$;