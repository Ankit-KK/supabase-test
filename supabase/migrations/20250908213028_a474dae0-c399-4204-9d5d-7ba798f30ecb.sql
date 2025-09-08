-- Fix security linter warnings from the previous migration

-- The SECURITY DEFINER view warnings are intentional for access control,
-- but let's make the view more explicit about its security model
DROP VIEW IF EXISTS public.user_signups_admin_view;

-- Create a more secure function-based approach instead of a SECURITY DEFINER view
CREATE OR REPLACE FUNCTION public.get_user_signups_secure(access_reason text DEFAULT 'Admin dashboard access')
RETURNS TABLE(
  id uuid,
  name text,
  email_masked text,
  mobile_masked text,
  email text,
  mobile_number text,
  youtube_channel text,
  instagram_handle text,
  created_at timestamp with time zone,
  accessed_at timestamp with time zone,
  accessed_by text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin access with audit logging
  IF NOT public.verify_admin_access_with_audit(access_reason, 'user_signups') THEN
    RAISE EXCEPTION 'Access denied: Invalid admin credentials';
  END IF;
  
  -- Return data with both masked and full versions for authorized admins
  RETURN QUERY
  SELECT 
    us.id,
    us.name,
    public.mask_email(us.email) as email_masked,
    public.mask_mobile(us.mobile_number) as mobile_masked,
    us.email, -- Full email for verified admins only
    us.mobile_number, -- Full mobile for verified admins only
    us.youtube_channel,
    us.instagram_handle,
    us.created_at,
    now() as accessed_at,
    auth.email() as accessed_by
  FROM public.user_signups us
  ORDER BY us.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_signups_secure TO authenticated;

-- Fix the safe_export function to ensure proper search_path
CREATE OR REPLACE FUNCTION public.safe_export_user_signups(export_reason text)
RETURNS TABLE(
  export_id uuid,
  name text,
  email_masked text,
  mobile_masked text,
  youtube_channel text,
  instagram_handle text,
  created_at timestamp with time zone,
  export_metadata jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  export_uuid uuid := gen_random_uuid();
  current_admin text;
BEGIN
  -- Verify admin access with detailed reason
  IF NOT public.verify_admin_access_with_audit(
    'BULK_EXPORT: ' || export_reason,
    'user_signups'
  ) THEN
    RAISE EXCEPTION 'Access denied: Invalid admin credentials for export';
  END IF;
  
  -- Require detailed export reason (minimum 20 characters)
  IF export_reason IS NULL OR length(trim(export_reason)) < 20 THEN
    RAISE EXCEPTION 'Export denied: Detailed reason (minimum 20 characters) required';
  END IF;
  
  current_admin := auth.email();
  
  -- Log the export with full metadata
  INSERT INTO public.sensitive_data_access_log (
    table_name,
    access_type,
    accessed_by,
    access_reason,
    session_info
  ) VALUES (
    'user_signups',
    'SAFE_BULK_EXPORT',
    current_admin,
    export_reason,
    jsonb_build_object(
      'export_id', export_uuid,
      'export_function', 'safe_export_user_signups',
      'timestamp', now(),
      'security_level', 'MASKED_DATA_ONLY'
    )
  );
  
  -- Return masked data only (never expose full contact details in bulk)
  RETURN QUERY
  SELECT 
    export_uuid as export_id,
    us.name,
    public.mask_email(us.email) as email_masked,
    public.mask_mobile(us.mobile_number) as mobile_masked,
    us.youtube_channel,
    us.instagram_handle,
    us.created_at,
    jsonb_build_object(
      'export_id', export_uuid,
      'exported_by', current_admin,
      'export_timestamp', now(),
      'data_type', 'masked_only'
    ) as export_metadata
  FROM public.user_signups us
  ORDER BY us.created_at DESC;
END;
$$;

-- Ensure existing functions have proper search_path settings
CREATE OR REPLACE FUNCTION public.mask_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
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
SECURITY DEFINER
SET search_path = public
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