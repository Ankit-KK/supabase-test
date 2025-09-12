-- Create secure functions for fetching donation data for authenticated streamers

-- Function to get donations for a specific streamer (secure version)
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
BEGIN
  -- Verify that the current user owns this streamer or is an admin
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.streamers s
      WHERE s.id = p_streamer_id AND s.user_id = auth.uid()
    ) OR 
    public.is_admin_email(auth.email())
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only view your own streamer donations';
  END IF;

  -- Return donations based on table name
  IF p_table_name = 'ankit_donations' THEN
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.approved_by, d.approved_at, d.rejected_reason,
      d.created_at, d.is_hyperemote, d.payment_status, d.streamer_id, d.message_visible
    FROM public.ankit_donations d
    WHERE d.streamer_id = p_streamer_id
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
    ORDER BY d.created_at DESC
    LIMIT 50;
  END IF;
END;
$function$;

-- Function to get moderation donations for a specific streamer
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
BEGIN
  -- Verify that the current user owns this streamer or is an admin
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.streamers s
      WHERE s.id = p_streamer_id AND s.user_id = auth.uid()
    ) OR 
    public.is_admin_email(auth.email())
  ) THEN
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