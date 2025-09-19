-- Enable real-time for all donation tables and set proper replica identity
ALTER TABLE public.ankit_donations REPLICA IDENTITY FULL;
ALTER TABLE public.chia_gaming_donations REPLICA IDENTITY FULL;
ALTER TABLE public.demostreamer_donations REPLICA IDENTITY FULL;

-- Add all donation tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ankit_donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chia_gaming_donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.demostreamer_donations;

-- Check if get_streamer_by_email function exists, if not create it
CREATE OR REPLACE FUNCTION public.get_streamer_by_email(user_email text)
RETURNS TABLE(streamer_slug text, is_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if email is admin first
  IF public.is_admin_email(user_email) THEN
    RETURN QUERY
    SELECT s.streamer_slug, true as is_admin
    FROM public.streamers s;
  END IF;
  
  -- Check specific streamer access
  RETURN QUERY
  SELECT s.streamer_slug, false as is_admin
  FROM public.streamers s
  INNER JOIN public.streamers_auth_emails sae ON s.id = sae.streamer_id
  WHERE lower(sae.email) = lower(user_email)
  
  UNION ALL
  
  -- Check user_id linked streamers
  SELECT s.streamer_slug, false as is_admin
  FROM public.streamers s
  WHERE s.user_id = (SELECT id FROM auth.users WHERE email = user_email);
END;
$function$;