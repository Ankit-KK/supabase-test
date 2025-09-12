-- Fix secure functions to properly check email permissions first

DROP FUNCTION IF EXISTS public.get_streamer_donations(uuid, text);
DROP FUNCTION IF EXISTS public.get_streamer_moderation_donations(uuid, text);

-- Updated function to get donations for a specific streamer (with proper email permissions)
CREATE OR REPLACE FUNCTION public.get_streamer_donations(p_streamer_id uuid, p_table_name text DEFAULT 'demostreamer_donations')
 RETURNS TABLE(
   id uuid, 
   name text, 
   amount numeric, 
   message text, 
   voice_message_url text,
   moderation_status text,
   approved_by text,
   approved_at timestamp with time zone,
   rejected_reason text,
   created_at timestamp with time zone,
   is_hyperemote boolean,
   payment_status text,
   streamer_id uuid,
   message_visible boolean
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  streamer_slug_var text;
  has_access boolean := false;
BEGIN
  -- Get the streamer slug for this ID
  SELECT s.streamer_slug INTO streamer_slug_var
  FROM public.streamers s
  WHERE s.id = p_streamer_id;

  IF streamer_slug_var IS NULL THEN
    RAISE EXCEPTION 'Streamer not found';
  END IF;

  -- Check access permissions (email-based first, then ownership, then admin)
  SELECT public.check_streamer_email_allowed(streamer_slug_var, auth.email()) INTO has_access;
  
  IF NOT has_access THEN
    -- Check if user owns this streamer
    has_access := EXISTS (
      SELECT 1 FROM public.streamers s
      WHERE s.id = p_streamer_id AND s.user_id = auth.uid()
    );
  END IF;
  
  IF NOT has_access THEN
    -- Check if user is admin
    has_access := public.is_admin_email(auth.email());
  END IF;

  IF NOT has_access THEN
    RAISE EXCEPTION 'Access denied: You can only view your own streamer donations';
  END IF;

  -- Return donations based on table name (only approved ones for dashboard)
  IF p_table_name = 'ankit_donations' THEN
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.approved_by, d.approved_at, d.rejected_reason,
      d.created_at, d.is_hyperemote, d.payment_status, d.streamer_id, d.message_visible
    FROM public.ankit_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND d.moderation_status IN ('approved', 'auto_approved')
    ORDER BY d.created_at DESC
    LIMIT 50;
  ELSIF p_table_name = 'chia_gaming_donations' THEN
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.approved_by, d.approved_at, d.rejected_reason,
      d.created_at, d.is_hyperemote, d.payment_status, d.streamer_id, d.message_visible
    FROM public.chia_gaming_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND d.moderation_status IN ('approved', 'auto_approved')
    ORDER BY d.created_at DESC
    LIMIT 50;
  ELSE
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.approved_by, d.approved_at, d.rejected_reason,
      d.created_at, d.is_hyperemote, d.payment_status, d.streamer_id, d.message_visible
    FROM public.demostreamer_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND d.moderation_status IN ('approved', 'auto_approved')
    ORDER BY d.created_at DESC
    LIMIT 50;
  END IF;
END;
$function$;

-- Updated function to get moderation donations for a specific streamer
CREATE OR REPLACE FUNCTION public.get_streamer_moderation_donations(p_streamer_id uuid, p_table_name text DEFAULT 'demostreamer_donations')
 RETURNS TABLE(
   id uuid, 
   name text, 
   amount numeric, 
   message text, 
   voice_message_url text,
   moderation_status text,
   approved_by text,
   approved_at timestamp with time zone,
   rejected_reason text,
   created_at timestamp with time zone,
   is_hyperemote boolean,
   payment_status text,
   streamer_id uuid,
   message_visible boolean
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  streamer_slug_var text;
  has_access boolean := false;
BEGIN
  -- Get the streamer slug for this ID
  SELECT s.streamer_slug INTO streamer_slug_var
  FROM public.streamers s
  WHERE s.id = p_streamer_id;

  IF streamer_slug_var IS NULL THEN
    RAISE EXCEPTION 'Streamer not found';
  END IF;

  -- Check access permissions (email-based first, then ownership, then admin)
  SELECT public.check_streamer_email_allowed(streamer_slug_var, auth.email()) INTO has_access;
  
  IF NOT has_access THEN
    -- Check if user owns this streamer
    has_access := EXISTS (
      SELECT 1 FROM public.streamers s
      WHERE s.id = p_streamer_id AND s.user_id = auth.uid()
    );
  END IF;
  
  IF NOT has_access THEN
    -- Check if user is admin
    has_access := public.is_admin_email(auth.email());
  END IF;

  IF NOT has_access THEN
    RAISE EXCEPTION 'Access denied: You can only view your own streamer donations';
  END IF;

  -- Return donations for moderation based on table name
  IF p_table_name = 'ankit_donations' THEN
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.approved_by, d.approved_at, d.rejected_reason,
      d.created_at, d.is_hyperemote, d.payment_status, d.streamer_id, d.message_visible
    FROM public.ankit_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND d.moderation_status != 'auto_approved'
    ORDER BY d.created_at DESC;
  ELSIF p_table_name = 'chia_gaming_donations' THEN
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.approved_by, d.approved_at, d.rejected_reason,
      d.created_at, d.is_hyperemote, d.payment_status, d.streamer_id, d.message_visible
    FROM public.chia_gaming_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND d.moderation_status != 'auto_approved'
    ORDER BY d.created_at DESC;
  ELSE
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.approved_by, d.approved_at, d.rejected_reason,
      d.created_at, d.is_hyperemote, d.payment_status, d.streamer_id, d.message_visible
    FROM public.demostreamer_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND d.moderation_status != 'auto_approved'
    ORDER BY d.created_at DESC;
  END IF;
END;
$function$;