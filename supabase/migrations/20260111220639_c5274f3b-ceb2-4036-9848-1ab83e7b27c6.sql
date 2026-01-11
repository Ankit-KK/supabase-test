CREATE OR REPLACE FUNCTION public.update_streamer_brand_color(
  p_streamer_slug text, 
  p_color text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.streamers 
  SET brand_color = p_color,
      updated_at = now()
  WHERE streamer_slug = p_streamer_slug;
  
  RETURN FOUND;
END;
$$;