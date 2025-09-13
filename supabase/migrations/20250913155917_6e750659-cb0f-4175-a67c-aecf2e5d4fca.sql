-- Fix get_streamer_moderation_donations using similar helper function approach

-- Create helper functions for moderation donations
CREATE OR REPLACE FUNCTION public.get_ankit_moderation_donations_for_streamer(p_streamer_id uuid)
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
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    a.id,
    a.name,
    a.amount,
    a.message,
    a.payment_status,
    a.moderation_status,
    a.created_at,
    a.is_hyperemote,
    a.voice_message_url,
    a.message_visible
  FROM public.ankit_donations a
  WHERE a.streamer_id = p_streamer_id
    AND a.payment_status = 'success'
    AND a.moderation_status = 'pending'
    AND COALESCE(a.is_hyperemote, false) = false;
$$;

CREATE OR REPLACE FUNCTION public.get_chia_moderation_donations_for_streamer(p_streamer_id uuid)
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
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    AND COALESCE(c.is_hyperemote, false) = false;
$$;

CREATE OR REPLACE FUNCTION public.get_demo_moderation_donations_for_streamer(p_streamer_id uuid)
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
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    AND COALESCE(d.is_hyperemote, false) = false;
$$;

-- Recreate main moderation function using helper functions
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
  SELECT * FROM public.get_ankit_moderation_donations_for_streamer(p_streamer_id)
  UNION ALL
  SELECT * FROM public.get_chia_moderation_donations_for_streamer(p_streamer_id)
  UNION ALL
  SELECT * FROM public.get_demo_moderation_donations_for_streamer(p_streamer_id)
  ORDER BY created_at DESC
  LIMIT 50;
END;
$$;