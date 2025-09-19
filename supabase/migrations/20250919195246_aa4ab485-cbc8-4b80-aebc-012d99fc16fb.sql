-- Fix ambiguous column reference in get_streamer_obs_tokens function
CREATE OR REPLACE FUNCTION public.get_streamer_obs_tokens(p_streamer_id uuid, p_user_id uuid)
RETURNS TABLE(id uuid, token text, is_active boolean, created_at timestamp with time zone, expires_at timestamp with time zone, last_used_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user owns this streamer or is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.streamers s
    WHERE s.id = p_streamer_id 
    AND (s.user_id = p_user_id OR public.is_admin_email(
      (SELECT au.email FROM public.auth_users au WHERE au.id = p_user_id)
    ))
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only view tokens for your own streams';
  END IF;
  
  -- Return OBS tokens for the streamer with explicit column aliases
  RETURN QUERY
  SELECT 
    ot.id as id,
    ot.token as token,
    ot.is_active as is_active,
    ot.created_at as created_at,
    ot.expires_at as expires_at,
    ot.last_used_at as last_used_at
  FROM public.obs_tokens ot
  WHERE ot.streamer_id = p_streamer_id
  ORDER BY ot.created_at DESC;
END;
$function$