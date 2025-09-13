-- Create the get_streamer_moderation_donations function
DROP FUNCTION IF EXISTS public.get_streamer_moderation_donations(uuid);

CREATE OR REPLACE FUNCTION public.get_streamer_moderation_donations(p_streamer_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  amount numeric,
  message text,
  voice_message_url text,
  tts_audio_url text,
  moderation_status text,
  approved_by text,
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz,
  is_hyperemote boolean,
  payment_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify access: user must own the streamer or be admin
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.streamers s
      WHERE s.id = p_streamer_id AND s.user_id = auth.uid()
    ) OR 
    public.is_admin_email(auth.email())
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only view moderation data for your own streams';
  END IF;

  -- Return moderation data from all donation tables for this streamer
  RETURN QUERY
  SELECT 
    ad.id,
    ad.name,
    ad.amount,
    ad.message,
    ad.voice_message_url,
    ad.tts_audio_url,
    ad.moderation_status,
    ad.approved_by,
    ad.approved_at,
    ad.rejected_reason,
    ad.created_at,
    ad.is_hyperemote,
    ad.payment_status
  FROM public.ankit_donations ad
  WHERE ad.streamer_id = p_streamer_id
    AND ad.payment_status = 'success'
  
  UNION ALL
  
  SELECT 
    cd.id,
    cd.name,
    cd.amount,
    cd.message,
    cd.voice_message_url,
    NULL as tts_audio_url,
    cd.moderation_status,
    cd.approved_by,
    cd.approved_at,
    cd.rejected_reason,
    cd.created_at,
    cd.is_hyperemote,
    cd.payment_status
  FROM public.chia_gaming_donations cd
  WHERE cd.streamer_id = p_streamer_id
    AND cd.payment_status = 'success'
  
  UNION ALL
  
  SELECT 
    dd.id,
    dd.name,
    dd.amount,
    dd.message,
    dd.voice_message_url,
    dd.tts_audio_url,
    dd.moderation_status,
    dd.approved_by,
    dd.approved_at,
    dd.rejected_reason,
    dd.created_at,
    dd.is_hyperemote,
    dd.payment_status
  FROM public.demostreamer_donations dd
  WHERE dd.streamer_id = p_streamer_id
    AND dd.payment_status = 'success'
  
  ORDER BY created_at DESC;
END;
$$;