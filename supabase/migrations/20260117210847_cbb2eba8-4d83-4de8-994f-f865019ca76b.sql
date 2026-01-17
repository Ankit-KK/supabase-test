-- Fix SECURITY DEFINER views by recreating them with security_invoker = on
-- This ensures views enforce RLS policies of the querying user, not the view creator

-- 1. Drop and recreate user_signups_secure with security_invoker
DROP VIEW IF EXISTS public.user_signups_secure;

CREATE VIEW public.user_signups_secure 
WITH (security_invoker = on) AS
SELECT 
    user_signups.id,
    user_signups.name,
    mask_email(user_signups.email) AS email_masked,
    mask_mobile(user_signups.mobile_number) AS mobile_masked,
    user_signups.youtube_channel,
    user_signups.instagram_handle,
    user_signups.created_at,
    true AS is_masked_data,
    'Use get_user_signup_full() for accessing complete record with justification'::text AS data_access_note
FROM user_signups
WHERE verify_admin_access_with_audit('Viewing masked user signups'::text, 'user_signups'::text);

-- Grant appropriate permissions
GRANT SELECT ON public.user_signups_secure TO anon, authenticated, service_role;

-- 2. Drop and recreate user_signups_masked with security_invoker
DROP VIEW IF EXISTS public.user_signups_masked;

CREATE VIEW public.user_signups_masked 
WITH (security_invoker = on) AS
SELECT 
    user_signups.id,
    user_signups.name,
    mask_email(user_signups.email) AS email_masked,
    mask_mobile(user_signups.mobile_number) AS mobile_masked,
    user_signups.youtube_channel,
    user_signups.instagram_handle,
    user_signups.created_at
FROM user_signups
WHERE verify_admin_with_audit('Viewing masked signup data'::text);

-- Grant appropriate permissions
GRANT SELECT ON public.user_signups_masked TO anon, authenticated, service_role;