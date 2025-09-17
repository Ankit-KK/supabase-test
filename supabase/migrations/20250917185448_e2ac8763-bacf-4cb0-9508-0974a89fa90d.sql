-- Create Ankit-specific functions that work with simple authentication

-- Function to get Ankit donations without requiring Supabase auth session
CREATE OR REPLACE FUNCTION public.get_ankit_donations(p_streamer_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  amount numeric,
  message text,
  voice_message_url text,
  moderation_status text,
  payment_status text,
  created_at timestamp with time zone,
  approved_at timestamp with time zone,
  is_hyperemote boolean,
  message_visible boolean,
  voice_duration_seconds integer,
  approved_by text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify this is the Ankit streamer
  IF NOT EXISTS (
    SELECT 1 FROM public.streamers 
    WHERE id = p_streamer_id AND streamer_slug = 'ankit'
  ) THEN
    RAISE EXCEPTION 'Access denied: Invalid streamer';
  END IF;

  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.amount,
    d.message,
    d.voice_message_url,
    d.moderation_status,
    d.payment_status,
    d.created_at,
    d.approved_at,
    d.is_hyperemote,
    d.message_visible,
    d.voice_duration_seconds,
    d.approved_by
  FROM public.ankit_donations d
  WHERE d.streamer_id = p_streamer_id
    AND d.payment_status = 'success'
  ORDER BY d.created_at DESC;
END;
$$;

-- Function to get Ankit moderation donations without requiring Supabase auth session
CREATE OR REPLACE FUNCTION public.get_ankit_moderation_donations(p_streamer_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  amount numeric,
  message text,
  voice_message_url text,
  moderation_status text,
  payment_status text,
  created_at timestamp with time zone,
  approved_at timestamp with time zone,
  is_hyperemote boolean,
  message_visible boolean,
  voice_duration_seconds integer,
  approved_by text,
  rejected_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify this is the Ankit streamer
  IF NOT EXISTS (
    SELECT 1 FROM public.streamers 
    WHERE id = p_streamer_id AND streamer_slug = 'ankit'
  ) THEN
    RAISE EXCEPTION 'Access denied: Invalid streamer';
  END IF;

  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.amount,
    d.message,
    d.voice_message_url,
    d.moderation_status,
    d.payment_status,
    d.created_at,
    d.approved_at,
    d.is_hyperemote,
    d.message_visible,
    d.voice_duration_seconds,
    d.approved_by,
    d.rejected_reason
  FROM public.ankit_donations d
  WHERE d.streamer_id = p_streamer_id
    AND d.payment_status = 'success'
    AND d.moderation_status = 'pending'
  ORDER BY d.created_at DESC;
END;
$$;