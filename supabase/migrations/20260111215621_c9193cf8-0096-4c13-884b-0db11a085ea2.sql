CREATE OR REPLACE FUNCTION public.update_streamer_leaderboard_setting(
  p_streamer_slug text, 
  p_enabled boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.streamers 
  SET leaderboard_widget_enabled = p_enabled,
      updated_at = now()
  WHERE streamer_slug = p_streamer_slug;
  
  RETURN FOUND;
END;
$$;