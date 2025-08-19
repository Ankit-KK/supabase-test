-- Update the regenerate_obs_token function to handle legacy streamers without user_id
-- and provide better error messages for debugging
CREATE OR REPLACE FUNCTION public.regenerate_obs_token(
  streamer_id uuid,
  new_token text,
  expires_at timestamptz DEFAULT NULL
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
  WHERE s.id = regenerate_obs_token.streamer_id;
  
  -- Check if streamer exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'streamer not found with id: %', regenerate_obs_token.streamer_id;
  END IF;
  
  -- For legacy streamers without user_id, allow regeneration
  -- For streamers with user_id, check ownership
  IF streamer_record.user_id IS NOT NULL AND (current_user_id IS NULL OR streamer_record.user_id != current_user_id) THEN
    RAISE EXCEPTION 'not authorized to regenerate token for this streamer. Current user: %, Streamer user: %', current_user_id, streamer_record.user_id;
  END IF;

  -- Deactivate existing active tokens
  UPDATE public.obs_tokens
  SET is_active = false
  WHERE streamer_id = regenerate_obs_token.streamer_id
    AND is_active = true;

  -- Insert new active token
  RETURN QUERY
  INSERT INTO public.obs_tokens (streamer_id, token, is_active, expires_at)
  VALUES (regenerate_obs_token.streamer_id, regenerate_obs_token.new_token, true, regenerate_obs_token.expires_at)
  RETURNING token;
END;
$$;

-- Grant execute permission to anonymous users as well for legacy streamers
GRANT EXECUTE ON FUNCTION public.regenerate_obs_token(uuid, text, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.regenerate_obs_token(uuid, text, timestamptz) TO authenticated;