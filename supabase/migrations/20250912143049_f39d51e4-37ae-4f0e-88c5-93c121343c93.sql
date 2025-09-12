-- Fix the check_streamer_email_allowed function to properly handle updated emails
-- and ensure authentication works correctly after email changes

-- Update the function to be more robust
CREATE OR REPLACE FUNCTION public.check_streamer_email_allowed(p_streamer_slug text, p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  s_id uuid;
  has_specific boolean;
  email_count integer;
BEGIN
  -- Admin emails are always allowed
  IF public.is_admin_email(p_email) THEN
    RETURN true;
  END IF;

  -- Get the streamer ID by slug
  SELECT id INTO s_id FROM public.streamers WHERE streamer_slug = p_streamer_slug LIMIT 1;
  IF s_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if there are any specific allowed emails configured for this streamer
  SELECT COUNT(*) INTO email_count FROM public.streamers_auth_emails WHERE streamer_id = s_id;
  
  -- If there are specific emails configured, the user must be in that list
  IF email_count > 0 THEN
    RETURN EXISTS (
      SELECT 1 FROM public.streamers_auth_emails 
      WHERE streamer_id = s_id AND lower(email) = lower(p_email)
    );
  END IF;

  -- If no specific emails are configured, allow all authenticated users (backward compatible)
  RETURN true;
END;
$$;

-- Also update the record_streamer_login function to handle cases better
CREATE OR REPLACE FUNCTION public.record_streamer_login(p_streamer_slug text, p_email text, p_provider text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.streamers
  SET last_login_provider = p_provider,
      last_login_email = p_email,
      last_login_at = now(),
      updated_at = now()
  WHERE streamer_slug = p_streamer_slug;
END;
$$;