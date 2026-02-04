-- Update get_user_streamers() to accept email parameter for custom auth compatibility
CREATE OR REPLACE FUNCTION public.get_user_streamers(
  p_user_id uuid,
  p_user_email text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  streamer_slug text, 
  streamer_name text,
  brand_color text,
  is_owner boolean,
  is_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    (s.user_id = p_user_id) as is_owner,
    -- Use provided email or fallback to auth.email()
    public.is_admin_email(COALESCE(p_user_email, auth.email())) as is_admin
  FROM public.streamers s
  WHERE s.user_id = p_user_id 
     OR public.is_admin_email(COALESCE(p_user_email, auth.email()));
END;
$$;