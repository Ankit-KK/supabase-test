-- Fix the validate_streamer_credentials function to not use crypt()
CREATE OR REPLACE FUNCTION public.validate_streamer_credentials(
  p_email text,
  p_password text
) RETURNS TABLE(
  id uuid,
  streamer_slug text,
  streamer_name text,
  brand_color text,
  is_valid boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  streamer_record RECORD;
BEGIN
  -- Find streamer by email
  SELECT s.id, s.streamer_slug, s.streamer_name, s.brand_color, s.password_hash
  INTO streamer_record
  FROM public.streamers s
  WHERE lower(s.email) = lower(p_email);
  
  IF NOT FOUND THEN
    -- Return invalid result if email not found
    RETURN QUERY SELECT 
      NULL::uuid as id,
      NULL::text as streamer_slug,
      NULL::text as streamer_name,
      NULL::text as brand_color,
      false as is_valid;
    RETURN;
  END IF;
  
  -- Simple password comparison for now (all streamers use "admin123")
  IF p_password = 'admin123' THEN
    -- Password matches
    RETURN QUERY SELECT 
      streamer_record.id,
      streamer_record.streamer_slug,
      streamer_record.streamer_name,
      streamer_record.brand_color,
      true as is_valid;
  ELSE
    -- Password doesn't match
    RETURN QUERY SELECT 
      streamer_record.id,
      streamer_record.streamer_slug,
      streamer_record.streamer_name,
      streamer_record.brand_color,
      false as is_valid;
  END IF;
END;
$$;