-- Completely rewrite functions without UNION ALL to eliminate ambiguity

-- Create a single comprehensive function that handles all donation types
DROP FUNCTION IF EXISTS public.get_streamer_donations(uuid);
DROP FUNCTION IF EXISTS public.get_ankit_donations_for_streamer(uuid);
DROP FUNCTION IF EXISTS public.get_chia_donations_for_streamer(uuid);
DROP FUNCTION IF EXISTS public.get_demo_donations_for_streamer(uuid);

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

  -- Return ankit donations
  FOR rec IN 
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
  LOOP
    id := rec.donation_id;
    name := rec.donation_name;
    amount := rec.donation_amount;
    message := rec.donation_message;
    payment_status := rec.donation_payment_status;
    moderation_status := rec.donation_moderation_status;
    created_at := rec.donation_created_at;
    is_hyperemote := rec.donation_is_hyperemote;
    voice_message_url := rec.donation_voice_message_url;
    message_visible := rec.donation_message_visible;
    RETURN NEXT;
  END LOOP;

  -- Return chia gaming donations
  FOR rec IN 
    SELECT 
      c.id as donation_id,
      c.name as donation_name,
      c.amount as donation_amount,
      c.message as donation_message,
      c.payment_status as donation_payment_status,
      c.moderation_status as donation_moderation_status,
      c.created_at as donation_created_at,
      c.is_hyperemote as donation_is_hyperemote,
      c.voice_message_url as donation_voice_message_url,
      c.message_visible as donation_message_visible
    FROM public.chia_gaming_donations c
    WHERE c.streamer_id = p_streamer_id
  LOOP
    id := rec.donation_id;
    name := rec.donation_name;
    amount := rec.donation_amount;
    message := rec.donation_message;
    payment_status := rec.donation_payment_status;
    moderation_status := rec.donation_moderation_status;
    created_at := rec.donation_created_at;
    is_hyperemote := rec.donation_is_hyperemote;
    voice_message_url := rec.donation_voice_message_url;
    message_visible := rec.donation_message_visible;
    RETURN NEXT;
  END LOOP;

  -- Return demo streamer donations
  FOR rec IN 
    SELECT 
      d.id as donation_id,
      d.name as donation_name,
      d.amount as donation_amount,
      d.message as donation_message,
      d.payment_status as donation_payment_status,
      d.moderation_status as donation_moderation_status,
      d.created_at as donation_created_at,
      d.is_hyperemote as donation_is_hyperemote,
      d.voice_message_url as donation_voice_message_url,
      d.message_visible as donation_message_visible
    FROM public.demostreamer_donations d
    WHERE d.streamer_id = p_streamer_id
  LOOP
    id := rec.donation_id;
    name := rec.donation_name;
    amount := rec.donation_amount;
    message := rec.donation_message;
    payment_status := rec.donation_payment_status;
    moderation_status := rec.donation_moderation_status;
    created_at := rec.donation_created_at;
    is_hyperemote := rec.donation_is_hyperemote;
    voice_message_url := rec.donation_voice_message_url;
    message_visible := rec.donation_message_visible;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;