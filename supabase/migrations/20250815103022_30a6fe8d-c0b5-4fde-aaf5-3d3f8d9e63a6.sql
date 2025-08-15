-- Fix function search path
CREATE OR REPLACE FUNCTION public.get_streamer_by_slug(slug TEXT)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  streamer_slug TEXT,
  streamer_name TEXT,
  brand_color TEXT,
  brand_logo_url TEXT,
  obs_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    s.brand_logo_url,
    s.obs_token
  FROM public.streamers s
  WHERE s.streamer_slug = slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';