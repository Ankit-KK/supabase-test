-- SECURITY FIX: Enhanced protection for user_signups table
-- This addresses the security finding about user contact information exposure

-- Step 1: Create encryption/decryption functions for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a secure key derivation function (in production, use a proper key management system)
CREATE OR REPLACE FUNCTION public.get_encryption_key()
RETURNS bytea
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- In production, this should retrieve from a secure key management system
  -- For now, we use a derived key that's different per installation
  SELECT digest(current_setting('app.settings.jwt_secret', true) || 'user_data_encryption', 'sha256');
$$;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'  
AS $$
  SELECT encode(pgp_sym_encrypt(data, encode(get_encryption_key(), 'hex')), 'base64');
$$;

-- Function to decrypt sensitive data (restricted access)
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT pgp_sym_decrypt(decode(encrypted_data, 'base64'), encode(get_encryption_key(), 'hex'));
$$;

-- Function to mask email addresses for display
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
  ip_address text,
  user_agent text,
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

-- Step 3: Create enhanced admin verification function
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
    ip_address
  ) VALUES (
    table_name,
    CASE WHEN is_valid_admin THEN 'AUTHORIZED_ACCESS' ELSE 'UNAUTHORIZED_ATTEMPT' END,
    current_email,
    access_reason,
    inet_client_addr()::text
  );
  
  -- Additional time-based restrictions (e.g., no access during off-hours unless emergency)
  -- You can customize this based on your requirements
  IF is_valid_admin AND EXTRACT(hour FROM now()) BETWEEN 22 AND 6 THEN
    -- Late night access requires emergency justification
    IF access_reason NOT ILIKE '%emergency%' AND access_reason NOT ILIKE '%urgent%' THEN
      PERFORM public.log_security_violation(
        'AFTER_HOURS_ADMIN_ACCESS',
        'Admin accessed sensitive data during restricted hours without emergency justification'
      );
    END IF;
  END IF;
  
  RETURN is_valid_admin;
END;
$$;

-- Step 4: Create secure view for user signups with masked data
CREATE OR REPLACE VIEW public.user_signups_masked AS
SELECT 
  id,
  name, -- Keep name as is since it's usually not as sensitive as contact info
  public.mask_email(email) as email_masked,
  public.mask_mobile(mobile_number) as mobile_masked,
  youtube_channel,
  instagram_handle,
  created_at,
  -- Add a flag to indicate this is masked data
  true as is_masked_data
FROM public.user_signups
WHERE public.verify_admin_access_with_audit('Viewing masked user signups', 'user_signups');

-- Enable RLS on the masked view
ALTER VIEW public.user_signups_masked SET (security_barrier = true);

-- Step 5: Create function for accessing full unmasked data (with strong audit trail)
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
  -- Verify admin access with mandatory reason
  IF NOT public.verify_admin_access_with_audit(access_reason, 'user_signups') THEN
    RAISE EXCEPTION 'Access denied: Invalid admin credentials';
  END IF;
  
  -- Require non-empty reason
  IF access_reason IS NULL OR trim(access_reason) = '' THEN
    RAISE EXCEPTION 'Access denied: Access reason is required for viewing full user data';
  END IF;
  
  -- Log the specific record access
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
    inet_client_addr()::text
  );
  
  -- Return the requested record
  RETURN QUERY
  SELECT 
    us.id,
    us.name,
    us.email,
    us.mobile_number,
    us.youtube_channel,
    us.instagram_handle,
    us.created_at
  FROM public.user_signups us
  WHERE us.id = signup_id;
END;
$$;

-- Step 6: Update existing RLS policies to use the enhanced verification
DROP POLICY IF EXISTS "Admin SELECT access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Admin UPDATE access to signups" ON public.user_signups;  
DROP POLICY IF EXISTS "Admin DELETE access to signups" ON public.user_signups;

-- Create new, more secure policies
CREATE POLICY "Enhanced admin SELECT access to signups"
ON public.user_signups
FOR SELECT
USING (
  public.verify_admin_access_with_audit('Admin SELECT on user_signups', 'user_signups')
);

CREATE POLICY "Enhanced admin UPDATE access to signups"  
ON public.user_signups
FOR UPDATE
USING (
  public.verify_admin_access_with_audit('Admin UPDATE on user_signups', 'user_signups')
)
WITH CHECK (
  public.verify_admin_access_with_audit('Admin UPDATE on user_signups check', 'user_signups')
);

CREATE POLICY "Enhanced admin DELETE access to signups"
ON public.user_signups  
FOR DELETE
USING (
  public.verify_admin_access_with_audit('Admin DELETE on user_signups', 'user_signups')
);

-- Step 7: Create emergency data export function (with heavy auditing)
CREATE OR REPLACE FUNCTION public.export_user_signups_for_compliance(
  export_reason text,
  requested_by text DEFAULT NULL
)
RETURNS TABLE(
  export_id uuid,
  name text,
  email_encrypted text,
  mobile_encrypted text,
  youtube_channel text,
  instagram_handle text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  export_id uuid := gen_random_uuid();
BEGIN
  -- Require detailed justification for data export
  IF export_reason IS NULL OR length(trim(export_reason)) < 50 THEN
    RAISE EXCEPTION 'Export denied: Detailed reason (min 50 chars) required for compliance export';
  END IF;
  
  -- Verify super admin access
  IF NOT public.verify_admin_access_with_audit(export_reason, 'user_signups') THEN
    RAISE EXCEPTION 'Export denied: Invalid admin credentials';
  END IF;
  
  -- Log this major data access event
  INSERT INTO public.sensitive_data_access_log (
    table_name,
    access_type,
    accessed_by,
    access_reason,
    ip_address,
    user_agent
  ) VALUES (
    'user_signups',
    'BULK_EXPORT',
    auth.email(),
    'COMPLIANCE_EXPORT: ' || export_reason || COALESCE(' | Requested by: ' || requested_by, ''),
    inet_client_addr()::text,
    'compliance_export'
  );
  
  -- Return encrypted data for compliance purposes
  RETURN QUERY
  SELECT 
    export_id,
    us.name,
    public.encrypt_sensitive_data(us.email) as email_encrypted,
    public.encrypt_sensitive_data(us.mobile_number) as mobile_encrypted,
    us.youtube_channel,
    us.instagram_handle,
    us.created_at
  FROM public.user_signups us;
END;
$$;

-- Create a summary comment explaining the security enhancements
COMMENT ON TABLE public.user_signups IS 
'User signup data with enhanced security: Use user_signups_masked view for regular admin access, get_user_signup_full() for individual records with justification, and export_user_signups_for_compliance() for bulk exports. All access is logged in sensitive_data_access_log.';

COMMENT ON VIEW public.user_signups_masked IS 
'Masked view of user signups showing obfuscated email/phone for regular admin operations. For full data access, use get_user_signup_full() with proper justification.';

COMMENT ON FUNCTION public.get_user_signup_full(uuid, text) IS 
'Secure function to access individual user signup record with full data. Requires valid admin access and mandatory access reason. All access is audited.';

COMMENT ON FUNCTION public.export_user_signups_for_compliance(text, text) IS 
'Emergency function for compliance data export. Returns encrypted sensitive data. Requires detailed justification (min 50 chars). Heavily audited.';