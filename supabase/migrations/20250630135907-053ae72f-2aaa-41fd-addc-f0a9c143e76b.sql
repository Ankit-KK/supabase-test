
-- Enable the pgcrypto extension for secure random generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the create_obs_token function to use a simpler approach
CREATE OR REPLACE FUNCTION public.create_obs_token(p_admin_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_token text;
BEGIN
  -- Generate secure random token using encode and gen_random_bytes
  new_token := encode(gen_random_bytes(32), 'base64url');
  
  -- Invalidate existing tokens for this admin_type
  UPDATE public.obs_access_tokens 
  SET is_active = false 
  WHERE admin_type = p_admin_type AND is_active = true;
  
  -- Insert new token with 24 hour expiry
  INSERT INTO public.obs_access_tokens (token, admin_type, expires_at)
  VALUES (new_token, p_admin_type, now() + interval '24 hours');
  
  -- Log token creation
  PERFORM public.log_security_event('CREATE_OBS_TOKEN', 'obs_access_tokens');
  
  RETURN new_token;
END;
$$;
