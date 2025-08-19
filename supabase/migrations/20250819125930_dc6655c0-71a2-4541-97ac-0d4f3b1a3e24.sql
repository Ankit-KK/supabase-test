-- Secure token regeneration via RPC to avoid client-side RLS insert issues
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
BEGIN
  -- Authorization: ensure caller owns this streamer
  IF NOT EXISTS (
    SELECT 1 FROM public.streamers s 
    WHERE s.id = regenerate_obs_token.streamer_id 
      AND s.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorized to regenerate token for this streamer';
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

GRANT EXECUTE ON FUNCTION public.regenerate_obs_token(uuid, text, timestamptz) TO authenticated;