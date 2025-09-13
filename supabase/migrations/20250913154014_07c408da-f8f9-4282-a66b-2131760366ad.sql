-- Fix the remaining ambiguous column reference by restructuring the function
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
  -- Ankit donations
  SELECT 
    ankit.id,
    ankit.name,
    ankit.amount,
    ankit.message,
    ankit.payment_status,
    ankit.moderation_status,
    ankit.created_at,
    ankit.is_hyperemote,
    ankit.voice_message_url,
    ankit.message_visible
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
  
  ORDER BY created_at DESC
  LIMIT 100;
END;
$$;