-- Create secure function to add moderator
CREATE OR REPLACE FUNCTION public.add_streamer_moderator(
  p_streamer_id uuid,
  p_mod_name text,
  p_telegram_user_id text
)
RETURNS TABLE(id uuid, mod_name text, telegram_user_id text, is_active boolean, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if the current user owns this streamer
  IF NOT EXISTS (
    SELECT 1 FROM public.streamers 
    WHERE id = p_streamer_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only add moderators for your own streams';
  END IF;
  
  -- Validate inputs
  IF p_mod_name IS NULL OR LENGTH(TRIM(p_mod_name)) = 0 OR LENGTH(p_mod_name) > 100 THEN
    RAISE EXCEPTION 'Invalid moderator name: must be 1-100 characters';
  END IF;
  
  IF p_telegram_user_id IS NULL OR LENGTH(TRIM(p_telegram_user_id)) = 0 OR LENGTH(p_telegram_user_id) > 50 THEN
    RAISE EXCEPTION 'Invalid Telegram User ID: must be 1-50 characters';
  END IF;
  
  -- Check if moderator already exists
  IF EXISTS (
    SELECT 1 FROM public.streamers_moderators 
    WHERE streamer_id = p_streamer_id 
    AND telegram_user_id = p_telegram_user_id 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Moderator with this Telegram User ID already exists for this streamer';
  END IF;
  
  -- Insert new moderator and return the record
  RETURN QUERY
  INSERT INTO public.streamers_moderators (streamer_id, mod_name, telegram_user_id)
  VALUES (p_streamer_id, TRIM(p_mod_name), TRIM(p_telegram_user_id))
  RETURNING 
    streamers_moderators.id,
    streamers_moderators.mod_name,
    streamers_moderators.telegram_user_id,
    streamers_moderators.is_active,
    streamers_moderators.created_at;
END;
$$;

-- Create secure function to remove moderator
CREATE OR REPLACE FUNCTION public.remove_streamer_moderator(
  p_streamer_id uuid,
  p_moderator_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if the current user owns this streamer
  IF NOT EXISTS (
    SELECT 1 FROM public.streamers 
    WHERE id = p_streamer_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only remove moderators from your own streams';
  END IF;
  
  -- Update moderator to inactive
  UPDATE public.streamers_moderators
  SET is_active = false
  WHERE id = p_moderator_id 
    AND streamer_id = p_streamer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Moderator not found or already removed';
  END IF;
  
  RETURN true;
END;
$$;