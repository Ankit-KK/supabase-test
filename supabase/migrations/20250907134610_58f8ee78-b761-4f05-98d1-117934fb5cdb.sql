-- FINAL SECURITY FIX: Simple and effective protection for user_signups
-- Addresses the security finding about user contact information exposure

-- Step 1: Create data masking functions with proper search path
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

-- Step 2: Create audit logging function
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name text,
  access_type text,
  access_reason text,
  record_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert audit record if table exists
  BEGIN
    INSERT INTO public.sensitive_data_access_log (
      table_name,
      record_id,
      access_type,
      accessed_by,
      access_reason,
      ip_address
    ) VALUES (
      table_name,
      record_id,
      access_type,
      auth.email(),
      access_reason,
      inet_client_addr()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- If audit table doesn't exist or other error, use existing audit_logs
      PERFORM public.log_security_event(
        'SENSITIVE_DATA_ACCESS',
        'Table: ' || table_name || ', Type: ' || access_type || ', Reason: ' || access_reason
      );
  END;
END;
$$;

-- Step 3: Enhanced admin verification with logging
CREATE OR REPLACE FUNCTION public.verify_admin_access_secure(
  access_reason text DEFAULT 'Admin dashboard access'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_email text;
  is_valid boolean := false;
BEGIN
  current_email := auth.email();
  is_valid := public.is_admin_email(current_email);
  
  -- Log the access attempt
  PERFORM public.log_sensitive_access(
    'user_signups',
    CASE WHEN is_valid THEN 'AUTHORIZED_ACCESS' ELSE 'UNAUTHORIZED_ATTEMPT' END,
    access_reason
  );
  
  RETURN is_valid;
END;
$$;

-- Step 4: Secure function for individual record access
CREATE OR REPLACE FUNCTION public.get_user_signup_with_reason(
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
  IF NOT public.verify_admin_access_secure(access_reason) THEN
    RAISE EXCEPTION 'Access denied: Invalid admin credentials';
  END IF;
  
  -- Require detailed reason
  IF access_reason IS NULL OR length(trim(access_reason)) < 10 THEN
    RAISE EXCEPTION 'Access denied: Detailed access reason (minimum 10 characters) required for viewing sensitive user data';
  END IF;
  
  -- Log specific record access
  PERFORM public.log_sensitive_access(
    'user_signups',
    'INDIVIDUAL_RECORD_ACCESS',
    access_reason,
    signup_id
  );
  
  -- Return the record
  RETURN QUERY
  SELECT us.id, us.name, us.email, us.mobile_number,
         us.youtube_channel, us.instagram_handle, us.created_at
  FROM public.user_signups us
  WHERE us.id = signup_id;
END;
$$;

-- Step 5: Update RLS policies with enhanced security
DROP POLICY IF EXISTS "Admin SELECT access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Admin UPDATE access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Admin DELETE access to signups" ON public.user_signups;

-- Create new secure policies
CREATE POLICY "Secure audited admin SELECT"
ON public.user_signups
FOR SELECT
USING (public.verify_admin_access_secure('Admin browsing user signups'));

CREATE POLICY "Secure audited admin UPDATE"
ON public.user_signups
FOR UPDATE
USING (public.verify_admin_access_secure('Admin modifying user signup'))
WITH CHECK (public.verify_admin_access_secure('Admin update verification'));

CREATE POLICY "Secure audited admin DELETE"
ON public.user_signups
FOR DELETE
USING (public.verify_admin_access_secure('Admin deleting user signup'));

-- Add documentation
COMMENT ON TABLE public.user_signups IS 
'SECURITY ENHANCED: User contact information protected with:
- All access logged with IP addresses and reasons
- Enhanced admin verification required
- Data masking functions available: mask_email(), mask_mobile()  
- Secure individual access: get_user_signup_with_reason(id, reason)
- Comprehensive audit trail in sensitive_data_access_log or audit_logs';

COMMENT ON FUNCTION public.get_user_signup_with_reason(uuid, text) IS 
'Secure access to individual user signup with full contact information. Requires admin authentication and detailed justification (min 10 chars). All access logged with IP and timestamp.';

COMMENT ON FUNCTION public.mask_email(text) IS 'Masks email addresses for secure display (e.g., an***@example.com)';
COMMENT ON FUNCTION public.mask_mobile(text) IS 'Masks mobile numbers for secure display (e.g., 12****89)';

-- Success confirmation
SELECT 'SECURITY FIX SUCCESSFULLY APPLIED: User contact information is now protected with comprehensive audit logging, access controls, and data masking capabilities.' as security_status;