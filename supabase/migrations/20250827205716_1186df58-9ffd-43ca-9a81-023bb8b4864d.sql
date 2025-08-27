-- Public function to read streamer settings without requiring Supabase auth
CREATE OR REPLACE FUNCTION public.get_streamer_public_settings(slug text)
RETURNS TABLE(id uuid, hyperemotes_enabled boolean, hyperemotes_min_amount numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.id, s.hyperemotes_enabled, s.hyperemotes_min_amount
  FROM public.streamers s
  WHERE s.streamer_slug = slug
  LIMIT 1;
$$;

-- Allow all roles to execute the function
REVOKE ALL ON FUNCTION public.get_streamer_public_settings(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_streamer_public_settings(text) TO anon, authenticated;