-- Fix moderator functions to work with custom auth system
CREATE OR REPLACE FUNCTION public.add_streamer_moderator(
  p_streamer_id uuid,
  p_mod_name text,
  p_telegram_user_id text,
  p_user_id uuid
)
RETURNS TABLE(id uuid, mod_name text, telegram_user_id text, is_active boolean, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_moderator_id uuid;
BEGIN
  -- Check if the provided user owns this streamer
  IF NOT EXISTS (
    SELECT 1 FROM public.streamers s
    WHERE s.id = p_streamer_id AND s.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only add moderators to your own streams';
  END IF;
  
  -- Validate inputs
  IF p_mod_name IS NULL OR LENGTH(TRIM(p_mod_name)) = 0 THEN
    RAISE EXCEPTION 'Moderator name is required';
  END IF;
  
  IF p_telegram_user_id IS NULL OR LENGTH(TRIM(p_telegram_user_id)) = 0 THEN
    RAISE EXCEPTION 'Telegram User ID is required';
  END IF;
  
  -- Check if moderator already exists for this streamer
  IF EXISTS (
    SELECT 1 FROM public.streamers_moderators sm
    WHERE sm.streamer_id = p_streamer_id 
      AND sm.telegram_user_id = p_telegram_user_id
      AND sm.is_active = true
  ) THEN
    RAISE EXCEPTION 'This Telegram user is already a moderator for this streamer';
  END IF;
  
  -- Insert new moderator and get the ID
  INSERT INTO public.streamers_moderators (streamer_id, mod_name, telegram_user_id, is_active)
  VALUES (p_streamer_id, TRIM(p_mod_name), TRIM(p_telegram_user_id), true)
  RETURNING streamers_moderators.id INTO new_moderator_id;
  
  -- Return the newly created moderator data
  RETURN QUERY
  SELECT 
    sm.id,
    sm.mod_name,
    sm.telegram_user_id,
    sm.is_active,
    sm.created_at
  FROM public.streamers_moderators sm
  WHERE sm.id = new_moderator_id;
END;
$function$;

-- Fix remove moderator function to work with custom auth system
CREATE OR REPLACE FUNCTION public.remove_streamer_moderator(
  p_streamer_id uuid,
  p_moderator_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the provided user owns this streamer
  IF NOT EXISTS (
    SELECT 1 FROM public.streamers s
    WHERE s.id = p_streamer_id AND s.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only remove moderators from your own streams';
  END IF;
  
  -- Remove moderator (set inactive)
  UPDATE public.streamers_moderators sm
  SET is_active = false
  WHERE sm.id = p_moderator_id 
    AND sm.streamer_id = p_streamer_id;
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$function$;