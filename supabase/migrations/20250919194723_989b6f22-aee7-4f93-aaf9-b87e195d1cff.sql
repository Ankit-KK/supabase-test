-- Add missing last_used_at column to obs_tokens table
ALTER TABLE public.obs_tokens ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone;

-- Add usage_count column for better token monitoring
ALTER TABLE public.obs_tokens ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0;

-- Update the get_streamer_obs_tokens function to fix ambiguous column references
CREATE OR REPLACE FUNCTION public.get_streamer_obs_tokens(p_streamer_id uuid, p_user_id uuid)
RETURNS TABLE(id uuid, token text, is_active boolean, created_at timestamp with time zone, expires_at timestamp with time zone, last_used_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user owns this streamer or is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.streamers 
    WHERE streamers.id = p_streamer_id 
    AND (streamers.user_id = p_user_id OR public.is_admin_email(
      (SELECT email FROM public.auth_users WHERE id = p_user_id)
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