-- Fix UNION ALL column consistency in get_streamer_donations function
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
  SELECT 
    donation_data.donation_id as id,
    donation_data.donor_name as name,
    donation_data.donation_amount as amount,
    donation_data.donation_message as message,
    donation_data.payment_state as payment_status,
    donation_data.moderation_state as moderation_status,
    donation_data.donation_time as created_at,
    donation_data.is_hyper as is_hyperemote,
    donation_data.voice_url as voice_message_url,
    donation_data.msg_visible as message_visible
  FROM (
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
      chia.id as donation_id,
      chia.name as donor_name,
      chia.amount as donation_amount,
      chia.message as donation_message,
      chia.payment_status as payment_state,
      chia.moderation_status as moderation_state,
      chia.created_at as donation_time,
      chia.is_hyperemote as is_hyper,
      chia.voice_message_url as voice_url,
      chia.message_visible as msg_visible
    FROM public.chia_gaming_donations chia
    WHERE chia.streamer_id = p_streamer_id
    
    UNION ALL
    
    -- Demo Streamer donations
    SELECT 
      demo.id as donation_id,
      demo.name as donor_name,
      demo.amount as donation_amount,
      demo.message as donation_message,
      demo.payment_status as payment_state,
      demo.moderation_status as moderation_state,
      demo.created_at as donation_time,
      demo.is_hyperemote as is_hyper,
      demo.voice_message_url as voice_url,
      demo.message_visible as msg_visible
    FROM public.demostreamer_donations demo
    WHERE demo.streamer_id = p_streamer_id
  ) donation_data
  ORDER BY donation_data.donation_time DESC
  LIMIT 100;
END;
$$;