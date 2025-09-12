-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_streamer_donations(uuid, text);
DROP FUNCTION IF EXISTS get_streamer_moderation_donations(uuid, text);

-- Recreate functions with proper security
CREATE FUNCTION get_streamer_donations(p_streamer_id uuid, p_table_name text)
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
  -- Allow access for authenticated users with their own streamers or admins
  IF NOT (
    EXISTS (SELECT 1 FROM streamers WHERE id = p_streamer_id AND user_id = auth.uid()) OR
    is_admin_email(auth.email()) OR
    current_setting('role') = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only view your own streamer data';
  END IF;

  IF p_table_name = 'ankit_donations' THEN
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.approved_by, d.approved_at, d.rejected_reason,
      d.created_at, d.is_hyperemote, d.payment_status, d.streamer_id, d.message_visible
    FROM ankit_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND (d.moderation_status = 'approved' OR d.moderation_status = 'auto_approved')
    ORDER BY d.created_at DESC;
  ELSIF p_table_name = 'chia_gaming_donations' THEN
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.approved_by, d.approved_at, d.rejected_reason,
      d.created_at, d.is_hyperemote, d.payment_status, d.streamer_id, d.message_visible
    FROM chia_gaming_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND (d.moderation_status = 'approved' OR d.moderation_status = 'auto_approved')
    ORDER BY d.created_at DESC;
  ELSIF p_table_name = 'demostreamer_donations' THEN
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.approved_by, d.approved_at, d.rejected_reason,
      d.created_at, d.is_hyperemote, d.payment_status, d.streamer_id, d.message_visible
    FROM demostreamer_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND (d.moderation_status = 'approved' OR d.moderation_status = 'auto_approved')
    ORDER BY d.created_at DESC;
  END IF;
END;
$function$;

-- Function to get donations needing moderation
CREATE FUNCTION get_streamer_moderation_donations(p_streamer_id uuid, p_table_name text)
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
  -- Allow access for authenticated users with their own streamers or admins
  IF NOT (
    EXISTS (SELECT 1 FROM streamers WHERE id = p_streamer_id AND user_id = auth.uid()) OR
    is_admin_email(auth.email()) OR
    current_setting('role') = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only view your own streamer data';
  END IF;

  IF p_table_name = 'ankit_donations' THEN
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.approved_by, d.approved_at, d.rejected_reason,
      d.created_at, d.is_hyperemote, d.payment_status, d.streamer_id, d.message_visible
    FROM ankit_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND d.moderation_status = 'pending'
    ORDER BY d.created_at ASC;
  ELSIF p_table_name = 'chia_gaming_donations' THEN
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.approved_by, d.approved_at, d.rejected_reason,
      d.created_at, d.is_hyperemote, d.payment_status, d.streamer_id, d.message_visible
    FROM chia_gaming_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND d.moderation_status = 'pending'
    ORDER BY d.created_at ASC;
  ELSIF p_table_name = 'demostreamer_donations' THEN
    RETURN QUERY
    SELECT 
      d.id, d.name, d.amount, d.message, d.voice_message_url,
      d.moderation_status, d.approved_by, d.approved_at, d.rejected_reason,
      d.created_at, d.is_hyperemote, d.payment_status, d.streamer_id, d.message_visible
    FROM demostreamer_donations d
    WHERE d.streamer_id = p_streamer_id
      AND d.payment_status = 'success'
      AND d.moderation_status = 'pending'
    ORDER BY d.created_at ASC;
  END IF;
END;
$function$;

-- Enable real-time updates for all donation tables
ALTER TABLE ankit_donations REPLICA IDENTITY FULL;
ALTER TABLE chia_gaming_donations REPLICA IDENTITY FULL;
ALTER TABLE demostreamer_donations REPLICA IDENTITY FULL;
ALTER TABLE streamers_moderators REPLICA IDENTITY FULL;

-- Add tables to realtime publication (ignore if already exists)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE ankit_donations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE chia_gaming_donations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE demostreamer_donations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE streamers_moderators;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END;
$$;