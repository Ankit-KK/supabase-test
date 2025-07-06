-- Update the create_obs_token function to use 1 year expiry instead of 24 hours
CREATE OR REPLACE FUNCTION public.create_obs_token(p_admin_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_token text;
BEGIN
  -- Verify user has access to this admin type
  IF NOT EXISTS(
    SELECT 1 FROM public.admin_users 
    WHERE user_email = auth.email() AND admin_type = p_admin_type
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to admin type %', p_admin_type;
  END IF;
  
  -- Generate secure random token using encode and gen_random_bytes
  new_token := encode(gen_random_bytes(32), 'base64url');
  
  -- Invalidate existing tokens for this user/admin_type
  UPDATE public.obs_access_tokens 
  SET is_active = false 
  WHERE admin_type = p_admin_type AND is_active = true;
  
  -- Insert new token with 1 year expiry (changed from 24 hours)
  INSERT INTO public.obs_access_tokens (token, admin_type, expires_at)
  VALUES (new_token, p_admin_type, now() + interval '1 year');
  
  -- Log token creation
  PERFORM public.log_security_event('CREATE_OBS_TOKEN', 'obs_access_tokens');
  
  RETURN new_token;
END;
$$;