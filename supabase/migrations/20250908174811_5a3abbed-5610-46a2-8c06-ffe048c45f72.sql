-- Fix security issue: Clean up conflicting RLS policies on user_signups table
-- Remove all existing policies and create clean, secure ones

-- Drop all existing conflicting policies on user_signups
DROP POLICY IF EXISTS "Allow anonymous signup creation" ON public.user_signups;
DROP POLICY IF EXISTS "Deny anonymous DELETE on signups" ON public.user_signups;
DROP POLICY IF EXISTS "Deny anonymous SELECT on signups" ON public.user_signups;
DROP POLICY IF EXISTS "Deny anonymous UPDATE on signups" ON public.user_signups;
DROP POLICY IF EXISTS "Deny authenticated DELETE on signups" ON public.user_signups;
DROP POLICY IF EXISTS "Deny authenticated INSERT on signups" ON public.user_signups;
DROP POLICY IF EXISTS "Deny authenticated SELECT on signups" ON public.user_signups;
DROP POLICY IF EXISTS "Deny authenticated UPDATE on signups" ON public.user_signups;
DROP POLICY IF EXISTS "Enhanced admin DELETE access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Enhanced admin SELECT access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Enhanced admin UPDATE access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Secure admin DELETE access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Secure admin SELECT access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Secure admin UPDATE access to signups" ON public.user_signups;
DROP POLICY IF EXISTS "Secure audited admin DELETE" ON public.user_signups;
DROP POLICY IF EXISTS "Secure audited admin SELECT" ON public.user_signups;
DROP POLICY IF EXISTS "Secure audited admin UPDATE" ON public.user_signups;

-- Create clean, secure policies with proper audit trail

-- Allow anonymous users to create signups (this is the main business function)
CREATE POLICY "Allow anonymous signup creation" 
ON public.user_signups 
FOR INSERT 
TO anon
WITH CHECK (
  -- Validate input data
  name IS NOT NULL AND
  length(trim(name)) >= 1 AND length(trim(name)) <= 100 AND
  email IS NOT NULL AND
  length(trim(email)) >= 5 AND length(trim(email)) <= 255 AND
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  mobile_number IS NOT NULL AND
  length(trim(mobile_number)) >= 8 AND length(trim(mobile_number)) <= 20 AND
  mobile_number ~ '^[0-9+\-\s\(\)]+$'
);

-- Deny all direct access to user_signups data (force use of secure functions)
CREATE POLICY "Deny direct access to signups" 
ON public.user_signups 
FOR ALL 
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- Allow only verified admins with proper audit logging to access data
CREATE POLICY "Admin access with mandatory audit logging" 
ON public.user_signups 
FOR ALL 
TO authenticated
USING (
  -- Only allow access if admin verification with audit logging succeeds
  public.verify_admin_access_with_audit(
    'Direct admin access to user_signups - should use secure functions instead', 
    'user_signups'
  )
)
WITH CHECK (
  -- Same verification for inserts/updates
  public.verify_admin_access_with_audit(
    'Direct admin modification to user_signups', 
    'user_signups'
  )
);

-- Create a secure view for admin access that automatically logs and masks sensitive data
CREATE OR REPLACE VIEW public.user_signups_admin_view AS
SELECT 
  id,
  name,
  public.mask_email(email) as email_masked,
  public.mask_mobile(mobile_number) as mobile_masked,
  email, -- Full email only for verified admins
  mobile_number, -- Full mobile only for verified admins
  youtube_channel,
  instagram_handle,
  created_at,
  -- Add access logging metadata
  now() as accessed_at,
  auth.email() as accessed_by
FROM public.user_signups
WHERE public.verify_admin_access_with_audit(
  'Admin viewing user signups via secure view',
  'user_signups'
);

-- Grant access to the secure view for authenticated users (RLS will handle authorization)
GRANT SELECT ON public.user_signups_admin_view TO authenticated;

-- Create a function for safe admin exports with automatic audit logging
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

-- Grant execute permission to authenticated users (function will handle authorization)
GRANT EXECUTE ON FUNCTION public.safe_export_user_signups TO authenticated;