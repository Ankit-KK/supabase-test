-- Fix ambiguous column reference in get_streamer_obs_tokens function
CREATE OR REPLACE FUNCTION public.get_streamer_obs_tokens(p_streamer_id uuid)
RETURNS TABLE(id uuid, token text, is_active boolean, created_at timestamp with time zone, expires_at timestamp with time zone, last_used_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user owns this streamer or is admin (fix ambiguous column reference)
  IF NOT EXISTS (
    SELECT 1 FROM public.streamers 
    WHERE streamers.id = p_streamer_id 
    AND (streamers.user_id = current_user_id OR public.is_admin_email(auth.email()))
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only view tokens for your own streams';
  END IF;
  
  -- Return OBS tokens for the streamer
  RETURN QUERY
  SELECT 
    ot.id,
    ot.token,
    ot.is_active,
    ot.created_at,
    ot.expires_at,
    ot.last_used_at
  FROM public.obs_tokens ot
  WHERE ot.streamer_id = p_streamer_id
  ORDER BY ot.created_at DESC;
END;
$function$;