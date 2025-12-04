-- Create secure RPC function to update alert box scale
CREATE OR REPLACE FUNCTION public.update_streamer_alert_box_scale(
  p_streamer_slug text,
  p_scale numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate scale value (must be one of the allowed options)
  IF p_scale NOT IN (0.75, 1.0, 1.25, 1.5) THEN
    RAISE EXCEPTION 'Invalid scale value. Must be 0.75, 1.0, 1.25, or 1.5';
  END IF;
  
  -- Update the streamer's alert box scale
  UPDATE public.streamers 
  SET alert_box_scale = p_scale,
      updated_at = now()
  WHERE streamer_slug = p_streamer_slug;
  
  RETURN FOUND;
END;
$$;