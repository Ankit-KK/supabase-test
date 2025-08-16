-- Create function to get streamer by OBS token
CREATE OR REPLACE FUNCTION public.get_streamer_by_obs_token(token text)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  streamer_slug text,
  streamer_name text,
  brand_color text,
  brand_logo_url text,
  obs_token text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  WHERE s.obs_token = token AND s.obs_token IS NOT NULL;
END;
$function$