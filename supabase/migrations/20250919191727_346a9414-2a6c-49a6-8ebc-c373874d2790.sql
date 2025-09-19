-- Fix get_streamer_by_email function to use custom auth_users table
CREATE OR REPLACE FUNCTION public.get_streamer_by_email(user_email text)
RETURNS TABLE(streamer_slug text, is_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.streamer_slug,
    public.is_admin_email(user_email) as is_admin
  FROM public.streamers s
  WHERE s.user_id = (SELECT id FROM public.auth_users WHERE email = user_email)
  
  UNION
  
  -- Also return admin access if user is admin
  SELECT DISTINCT
    s.streamer_slug,
    true as is_admin
  FROM public.streamers s
  WHERE public.is_admin_email(user_email);