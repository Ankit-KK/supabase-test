-- Create secure RPC function to get alerts for OBS token
CREATE OR REPLACE FUNCTION public.get_alerts_for_obs_token(p_obs_token text, p_table_name text DEFAULT 'demostreamer_donations'::text)
RETURNS TABLE(
  id uuid, 
  name text, 
  amount numeric, 
  message text, 
  voice_message_url text, 
  moderation_status text, 
  created_at timestamp with time zone, 
  is_hyperemote boolean, 
  payment_status text, 
  streamer_id uuid, 
  message_visible boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  token_valid RECORD;
BEGIN
  -- Validate OBS token first
  SELECT * INTO token_valid FROM public.validate_obs_token_secure(p_obs_token);
  
  IF NOT token_valid.is_valid THEN
    RAISE EXCEPTION 'Invalid OBS token';
  END IF;

  -- Return approved donations based on table name
  IF p_table_name = 'ankit_donations' THEN
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.created_at, d.is_hyperemote, 
      d.payment_status, d.streamer_id, d.message_visible
    FROM public.ankit_donations d
    WHERE d.streamer_id = token_valid.streamer_id
      AND d.payment_status = 'success'
      AND (d.moderation_status = 'approved' OR d.moderation_status = 'auto_approved')
      AND d.message_visible = true
    ORDER BY d.created_at DESC
    LIMIT 50;
  ELSIF p_table_name = 'chia_gaming_donations' THEN
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.created_at, d.is_hyperemote, 
      d.payment_status, d.streamer_id, d.message_visible
    FROM public.chia_gaming_donations d
    WHERE d.streamer_id = token_valid.streamer_id
      AND d.payment_status = 'success'
      AND (d.moderation_status = 'approved' OR d.moderation_status = 'auto_approved')
      AND d.message_visible = true
    ORDER BY d.created_at DESC
    LIMIT 50;
  ELSE
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.created_at, d.is_hyperemote, 
      d.payment_status, d.streamer_id, d.message_visible
    FROM public.demostreamer_donations d
    WHERE d.streamer_id = token_valid.streamer_id
      AND d.payment_status = 'success'
      AND (d.moderation_status = 'approved' OR d.moderation_status = 'auto_approved')
      AND d.message_visible = true
    ORDER BY d.created_at DESC
    LIMIT 50;
  END IF;
END;
$function$;