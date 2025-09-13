-- Update functions to use proper email-based authorization for streamers
DROP FUNCTION IF EXISTS public.get_streamer_donations(uuid);
DROP FUNCTION IF EXISTS public.get_streamer_moderation_donations(uuid);

-- Create get_streamer_donations function with email-based auth
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
  streamer_slug_var text;
BEGIN
  -- Get the streamer slug for authorization check
  SELECT s.streamer_slug INTO streamer_slug_var
  FROM public.streamers s
  WHERE s.id = p_streamer_id;
  
  IF streamer_slug_var IS NULL THEN
    RAISE EXCEPTION 'Streamer not found';
  END IF;

  -- Check if user is authorized using email-based permissions
  IF NOT (
    public.check_streamer_email_allowed(streamer_slug_var, COALESCE(auth.email(), '')) OR
    public.is_admin_email(COALESCE(auth.email(), ''))
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Return ankit donations
  FOR rec IN 
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
      AND a.moderation_status IN ('approved', 'auto_approved')
    ORDER BY a.created_at DESC
    LIMIT 100
  LOOP
    id := rec.id;
    name := rec.name;
    amount := rec.amount;
    message := rec.message;
    payment_status := rec.payment_status;
    moderation_status := rec.moderation_status;
    created_at := rec.created_at;
    is_hyperemote := rec.is_hyperemote;
    voice_message_url := rec.voice_message_url;
    message_visible := rec.message_visible;
    RETURN NEXT;
  END LOOP;

  -- Return chia gaming donations
  FOR rec IN 
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
      AND c.moderation_status IN ('approved', 'auto_approved')
    ORDER BY c.created_at DESC
    LIMIT 100
  LOOP
    id := rec.id;
    name := rec.name;
    amount := rec.amount;
    message := rec.message;
    payment_status := rec.payment_status;
    moderation_status := rec.moderation_status;
    created_at := rec.created_at;
    is_hyperemote := rec.is_hyperemote;
    voice_message_url := rec.voice_message_url;
    message_visible := rec.message_visible;
    RETURN NEXT;
  END LOOP;

  -- Return demo streamer donations
  FOR rec IN 
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
      AND d.moderation_status IN ('approved', 'auto_approved')
    ORDER BY d.created_at DESC
    LIMIT 100
  LOOP
    id := rec.id;
    name := rec.name;
    amount := rec.amount;
    message := rec.message;
    payment_status := rec.payment_status;
    moderation_status := rec.moderation_status;
    created_at := rec.created_at;
    is_hyperemote := rec.is_hyperemote;
    voice_message_url := rec.voice_message_url;
    message_visible := rec.message_visible;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

-- Create get_streamer_moderation_donations function with email-based auth
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
  streamer_slug_var text;
BEGIN
  -- Get the streamer slug for authorization check
  SELECT s.streamer_slug INTO streamer_slug_var
  FROM public.streamers s
  WHERE s.id = p_streamer_id;
  
  IF streamer_slug_var IS NULL THEN
    RAISE EXCEPTION 'Streamer not found';
  END IF;

  -- Check if user is authorized using email-based permissions
  IF NOT (
    public.check_streamer_email_allowed(streamer_slug_var, COALESCE(auth.email(), '')) OR
    public.is_admin_email(COALESCE(auth.email(), ''))
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Return ankit donations needing moderation
  FOR rec IN 
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
      AND COALESCE(a.is_hyperemote, false) = false
  LOOP
    id := rec.id;
    name := rec.name;
    amount := rec.amount;
    message := rec.message;
    payment_status := rec.payment_status;
    moderation_status := rec.moderation_status;
    created_at := rec.created_at;
    is_hyperemote := rec.is_hyperemote;
    voice_message_url := rec.voice_message_url;
    message_visible := rec.message_visible;
    RETURN NEXT;
  END LOOP;

  -- Return chia gaming donations needing moderation
  FOR rec IN 
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
  LOOP
    id := rec.id;
    name := rec.name;
    amount := rec.amount;
    message := rec.message;
    payment_status := rec.payment_status;
    moderation_status := rec.moderation_status;
    created_at := rec.created_at;
    is_hyperemote := rec.is_hyperemote;
    voice_message_url := rec.voice_message_url;
    message_visible := rec.message_visible;
    RETURN NEXT;
  END LOOP;

  -- Return demo streamer donations needing moderation
  FOR rec IN 
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
  LOOP
    id := rec.id;
    name := rec.name;
    amount := rec.amount;
    message := rec.message;
    payment_status := rec.payment_status;
    moderation_status := rec.moderation_status;
    created_at := rec.created_at;
    is_hyperemote := rec.is_hyperemote;
    voice_message_url := rec.voice_message_url;
    message_visible := rec.message_visible;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;