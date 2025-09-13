-- Fix the ORDER BY clause ambiguity in the get_streamer_donations function
DROP FUNCTION IF EXISTS public.get_streamer_donations(uuid);

CREATE OR REPLACE FUNCTION public.get_streamer_donations(p_streamer_id uuid)
RETURNS TABLE(
  id uuid,
  name text, 
  amount numeric,
  message text,
  payment_status text,
  moderation_status text,
  created_at timestamp with time zone,
  is_hyperemote boolean,
  voice_message_url text,
  message_visible boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user is authorized to view this streamer's data
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.streamers s
      WHERE s.id = p_streamer_id AND s.user_id = auth.uid()
    ) OR 
    public.is_admin_email(auth.email())
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH combined_donations AS (
    -- Ankit donations
    SELECT 
      ankit.id as donation_id,
      ankit.name as donor_name,
      ankit.amount as donation_amount,
      ankit.message as donation_message,
      ankit.payment_status as payment_state,
      ankit.moderation_status as moderation_state,
      ankit.created_at as donation_time,
      ankit.is_hyperemote as is_hyper,
      ankit.voice_message_url as voice_url,
      ankit.message_visible as msg_visible
    FROM public.ankit_donations ankit
    WHERE ankit.streamer_id = p_streamer_id
    
    UNION ALL
    
    -- Chia Gaming donations
    SELECT 
      chia.id,
      chia.name,
      chia.amount,
      chia.message,
      chia.payment_status,
      chia.moderation_status,
      chia.created_at,
      chia.is_hyperemote,
      chia.voice_message_url,
      chia.message_visible
    FROM public.chia_gaming_donations chia
    WHERE chia.streamer_id = p_streamer_id
    
    UNION ALL
    
    -- Demo Streamer donations
    SELECT 
      demo.id,
      demo.name,
      demo.amount,
      demo.message,
      demo.payment_status,
      demo.moderation_status,
      demo.created_at,
      demo.is_hyperemote,
      demo.voice_message_url,
      demo.message_visible
    FROM public.demostreamer_donations demo
    WHERE demo.streamer_id = p_streamer_id
  )
  SELECT 
    cd.donation_id,
    cd.donor_name,
    cd.donation_amount,
    cd.donation_message,
    cd.payment_state,
    cd.moderation_state,
    cd.donation_time,
    cd.is_hyper,
    cd.voice_url,
    cd.msg_visible
  FROM combined_donations cd
  ORDER BY cd.donation_time DESC
  LIMIT 100;
END;
$$;