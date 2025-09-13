-- Fix both functions by wrapping UNION ALL in subquery to resolve ORDER BY ambiguity

-- Fix get_streamer_donations function
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
    donations.donation_id as id,
    donations.donation_name as name,
    donations.donation_amount as amount,
    donations.donation_message as message,
    donations.donation_payment_status as payment_status,
    donations.donation_moderation_status as moderation_status,
    donations.donation_created_at as created_at,
    donations.donation_is_hyperemote as is_hyperemote,
    donations.donation_voice_message_url as voice_message_url,
    donations.donation_message_visible as message_visible
  FROM (
    -- Ankit donations
    SELECT 
      a.id as donation_id,
      a.name as donation_name,
      a.amount as donation_amount,
      a.message as donation_message,
      a.payment_status as donation_payment_status,
      a.moderation_status as donation_moderation_status,
      a.created_at as donation_created_at,
      a.is_hyperemote as donation_is_hyperemote,
      a.voice_message_url as donation_voice_message_url,
      a.message_visible as donation_message_visible
    FROM public.ankit_donations a
    WHERE a.streamer_id = p_streamer_id
    
    UNION ALL
    
    -- Chia Gaming donations  
    SELECT 
      c.id,
      c.name,
      c.amount,
      c.message,
      c.payment_status,
      c.moderation_status,
      c.created_at,
      c.is_hyperemote,
      c.voice_message_url,
      c.message_visible
    FROM public.chia_gaming_donations c
    WHERE c.streamer_id = p_streamer_id
    
    UNION ALL
    
    -- Demo Streamer donations
    SELECT 
      d.id,
      d.name,
      d.amount,
      d.message,
      d.payment_status,
      d.moderation_status,
      d.created_at,
      d.is_hyperemote,
      d.voice_message_url,
      d.message_visible
    FROM public.demostreamer_donations d
    WHERE d.streamer_id = p_streamer_id
  ) donations
  ORDER BY donations.donation_created_at DESC
  LIMIT 100;
END;
$$;

-- Fix get_streamer_moderation_donations function
DROP FUNCTION IF EXISTS public.get_streamer_moderation_donations(uuid);

CREATE OR REPLACE FUNCTION public.get_streamer_moderation_donations(p_streamer_id uuid)
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
    mod_donations.mod_id as id,
    mod_donations.mod_name as name,
    mod_donations.mod_amount as amount,
    mod_donations.mod_message as message,
    mod_donations.mod_payment_status as payment_status,
    mod_donations.mod_moderation_status as moderation_status,
    mod_donations.mod_created_at as created_at,
    mod_donations.mod_is_hyperemote as is_hyperemote,
    mod_donations.mod_voice_message_url as voice_message_url,
    mod_donations.mod_message_visible as message_visible
  FROM (
    -- Ankit donations needing moderation
    SELECT 
      a.id as mod_id,
      a.name as mod_name,
      a.amount as mod_amount,
      a.message as mod_message,
      a.payment_status as mod_payment_status,
      a.moderation_status as mod_moderation_status,
      a.created_at as mod_created_at,
      a.is_hyperemote as mod_is_hyperemote,
      a.voice_message_url as mod_voice_message_url,
      a.message_visible as mod_message_visible
    FROM public.ankit_donations a
    WHERE a.streamer_id = p_streamer_id
      AND a.payment_status = 'success'
      AND a.moderation_status = 'pending'
      AND COALESCE(a.is_hyperemote, false) = false
    
    UNION ALL
    
    -- Chia Gaming donations needing moderation
    SELECT 
      c.id,
      c.name,
      c.amount,
      c.message,
      c.payment_status,
      c.moderation_status,
      c.created_at,
      c.is_hyperemote,
      c.voice_message_url,
      c.message_visible
    FROM public.chia_gaming_donations c
    WHERE c.streamer_id = p_streamer_id
      AND c.payment_status = 'success'
      AND c.moderation_status = 'pending'
      AND COALESCE(c.is_hyperemote, false) = false
    
    UNION ALL
    
    -- Demo Streamer donations needing moderation
    SELECT 
      d.id,
      d.name,
      d.amount,
      d.message,
      d.payment_status,
      d.moderation_status,
      d.created_at,
      d.is_hyperemote,
      d.voice_message_url,
      d.message_visible
    FROM public.demostreamer_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND d.moderation_status = 'pending'
      AND COALESCE(d.is_hyperemote, false) = false
  ) mod_donations
  ORDER BY mod_donations.mod_created_at DESC
  LIMIT 50;
END;
$$;