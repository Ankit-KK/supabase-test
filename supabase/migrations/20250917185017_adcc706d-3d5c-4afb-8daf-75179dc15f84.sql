-- Fix crypt function schema references

-- Drop and recreate the authenticate_streamer_simple function with correct schema references
DROP FUNCTION IF EXISTS public.authenticate_streamer_simple(text, text);

CREATE OR REPLACE FUNCTION public.authenticate_streamer_simple(p_username text, p_password text)
RETURNS TABLE(id uuid, streamer_slug text, streamer_name text, brand_color text, success boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    true as success
  FROM public.streamers s
  WHERE s.username = p_username 
    AND s.password_hash IS NOT NULL
    AND s.password_hash = extensions.crypt(p_password, s.password_hash);
    
  -- If no rows returned, return a failure record
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      NULL::uuid,
      NULL::text,
      NULL::text,
      NULL::text,
      false as success;
  END IF;
END;
$$;

-- Update the Ankit streamer with properly hashed password using extensions schema
UPDATE public.streamers 
SET password_hash = extensions.crypt('ankit123', extensions.gen_salt('bf'))
WHERE streamer_slug = 'ankit' AND username = 'ankit';