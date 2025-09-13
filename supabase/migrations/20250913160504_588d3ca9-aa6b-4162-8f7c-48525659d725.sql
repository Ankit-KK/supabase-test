-- Fix moderation donations function using the same approach

DROP FUNCTION IF EXISTS public.get_streamer_moderation_donations(uuid);
DROP FUNCTION IF EXISTS public.get_ankit_moderation_donations_for_streamer(uuid);
DROP FUNCTION IF EXISTS public.get_chia_moderation_donations_for_streamer(uuid);
DROP FUNCTION IF EXISTS public.get_demo_moderation_donations_for_streamer(uuid);

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
DECLARE
  rec RECORD;
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

  -- Return ankit donations needing moderation
  FOR rec IN 
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
  LOOP
    id := rec.mod_id;
    name := rec.mod_name;
    amount := rec.mod_amount;
    message := rec.mod_message;
    payment_status := rec.mod_payment_status;
    moderation_status := rec.mod_moderation_status;
    created_at := rec.mod_created_at;
    is_hyperemote := rec.mod_is_hyperemote;
    voice_message_url := rec.mod_voice_message_url;
    message_visible := rec.mod_message_visible;
    RETURN NEXT;
  END LOOP;

  -- Return chia gaming donations needing moderation
  FOR rec IN 
    SELECT 
      c.id as mod_id,
      c.name as mod_name,
      c.amount as mod_amount,
      c.message as mod_message,
      c.payment_status as mod_payment_status,
      c.moderation_status as mod_moderation_status,
      c.created_at as mod_created_at,
      c.is_hyperemote as mod_is_hyperemote,
      c.voice_message_url as mod_voice_message_url,
      c.message_visible as mod_message_visible
    FROM public.chia_gaming_donations c
    WHERE c.streamer_id = p_streamer_id
      AND c.payment_status = 'success'
      AND c.moderation_status = 'pending'
      AND COALESCE(c.is_hyperemote, false) = false
  LOOP
    id := rec.mod_id;
    name := rec.mod_name;
    amount := rec.mod_amount;
    message := rec.mod_message;
    payment_status := rec.mod_payment_status;
    moderation_status := rec.mod_moderation_status;
    created_at := rec.mod_created_at;
    is_hyperemote := rec.mod_is_hyperemote;
    voice_message_url := rec.mod_voice_message_url;
    message_visible := rec.mod_message_visible;
    RETURN NEXT;
  END LOOP;

  -- Return demo streamer donations needing moderation
  FOR rec IN 
    SELECT 
      d.id as mod_id,
      d.name as mod_name,
      d.amount as mod_amount,
      d.message as mod_message,
      d.payment_status as mod_payment_status,
      d.moderation_status as mod_moderation_status,
      d.created_at as mod_created_at,
      d.is_hyperemote as mod_is_hyperemote,
      d.voice_message_url as mod_voice_message_url,
      d.message_visible as mod_message_visible
    FROM public.demostreamer_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND d.moderation_status = 'pending'
      AND COALESCE(d.is_hyperemote, false) = false
  LOOP
    id := rec.mod_id;
    name := rec.mod_name;
    amount := rec.mod_amount;
    message := rec.mod_message;
    payment_status := rec.mod_payment_status;
    moderation_status := rec.mod_moderation_status;
    created_at := rec.mod_created_at;
    is_hyperemote := rec.mod_is_hyperemote;
    voice_message_url := rec.mod_voice_message_url;
    message_visible := rec.mod_message_visible;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;