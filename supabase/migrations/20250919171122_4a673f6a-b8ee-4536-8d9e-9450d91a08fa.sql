-- Drop existing function and recreate with correct signature
DROP FUNCTION IF EXISTS public.get_streamer_by_email(text);

-- Create function to get streamer access by email for custom auth_users table
CREATE OR REPLACE FUNCTION public.get_streamer_by_email(user_email text)
RETURNS TABLE(streamer_slug text, is_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user is a super admin first
  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE email = lower(user_email)) THEN
    RETURN QUERY 
    SELECT 'admin'::text as streamer_slug, true as is_admin;
    RETURN;
  END IF;
  
  -- Check streamer-specific email assignments
  RETURN QUERY
  SELECT s.streamer_slug, false as is_admin
  FROM public.streamers s
  INNER JOIN public.streamers_auth_emails sae ON s.id = sae.streamer_id
  WHERE lower(sae.email) = lower(user_email);
  
  -- If no specific assignments found and user exists in auth_users, 
  -- allow access to any streamer (backward compatibility)
  IF NOT FOUND AND EXISTS (SELECT 1 FROM public.auth_users WHERE lower(email) = lower(user_email)) THEN
    RETURN QUERY
    SELECT 'all'::text as streamer_slug, false as is_admin;
  END IF;
END;
$$;

-- Create function to generate session tokens
CREATE OR REPLACE FUNCTION public.generate_session_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;

-- Create function to validate session tokens
CREATE OR REPLACE FUNCTION public.validate_session_token(token text)
RETURNS TABLE(user_id uuid, email text, username text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.username,
    au.role
  FROM public.auth_users au
  INNER JOIN public.auth_sessions ass ON au.id = ass.user_id
  WHERE ass.token = validate_session_token.token 
    AND ass.expires_at > now()
    AND au.is_active = true;
END;
$$;