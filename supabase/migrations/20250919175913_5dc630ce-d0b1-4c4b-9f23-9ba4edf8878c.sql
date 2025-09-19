-- Create simpler user-based access function
CREATE OR REPLACE FUNCTION public.get_user_streamers(p_user_id uuid)
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
    public.is_admin_email(auth.email()) as is_admin
  FROM public.streamers s
  WHERE s.user_id = p_user_id 
     OR public.is_admin_email(auth.email());
END;
$$;