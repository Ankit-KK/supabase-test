-- Drop and recreate the function with proper parameter names to fix ambiguous column reference
DROP FUNCTION public.regenerate_obs_token(uuid, text, timestamptz);

CREATE OR REPLACE FUNCTION public.regenerate_obs_token(
  p_streamer_id uuid,
  p_new_token text,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS TABLE(token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  streamer_record RECORD;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Get streamer record
  SELECT * INTO streamer_record
  FROM public.streamers s 
  WHERE s.id = p_streamer_id;
  
  -- Check if streamer exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'streamer not found with id: %', p_streamer_id;
  END IF;
  
  -- For legacy streamers without user_id, allow regeneration
  -- For streamers with user_id, check ownership
  IF streamer_record.user_id IS NOT NULL AND (current_user_id IS NULL OR streamer_record.user_id != current_user_id) THEN
    RAISE EXCEPTION 'not authorized to regenerate token for this streamer. Current user: %, Streamer user: %', current_user_id, streamer_record.user_id;
  END IF;

  -- Deactivate existing active tokens (properly qualified column references)
  UPDATE public.obs_tokens
  SET is_active = false
  WHERE obs_tokens.streamer_id = p_streamer_id
    AND obs_tokens.is_active = true;

  -- Insert new active token
  RETURN QUERY
  INSERT INTO public.obs_tokens (streamer_id, token, is_active, expires_at)
  VALUES (p_streamer_id, p_new_token, true, p_expires_at)
  RETURNING obs_tokens.token;
END;
$$;

-- Grant execute permission to anonymous users as well for legacy streamers
GRANT EXECUTE ON FUNCTION public.regenerate_obs_token(uuid, text, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.regenerate_obs_token(uuid, text, timestamptz) TO authenticated;