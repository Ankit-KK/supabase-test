
-- Enable the pgcrypto extension for secure random generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create table for OBS access tokens
CREATE TABLE IF NOT EXISTS public.obs_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  admin_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on the table
ALTER TABLE public.obs_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for the obs_access_tokens table
CREATE POLICY "Authenticated users can manage obs tokens" 
  ON public.obs_access_tokens 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Create the create_obs_token function
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
  
  -- Insert new token with 24 hour expiry
  INSERT INTO public.obs_access_tokens (token, admin_type, expires_at)
  VALUES (new_token, p_admin_type, now() + interval '24 hours');
  
  -- Log token creation
  PERFORM public.log_security_event('CREATE_OBS_TOKEN', 'obs_access_tokens');
  
  RETURN new_token;
END;
$$;

-- Create the validate_obs_token function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.validate_obs_token(p_token text, p_admin_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token_valid boolean := false;
BEGIN
  -- Check if token exists, is active, not expired, and matches admin_type
  SELECT EXISTS(
    SELECT 1 FROM public.obs_access_tokens
    WHERE token = p_token 
    AND admin_type = p_admin_type
    AND is_active = true
    AND expires_at > now()
  ) INTO token_valid;
  
  -- Update last_used_at if token is valid
  IF token_valid THEN
    UPDATE public.obs_access_tokens 
    SET last_used_at = now()
    WHERE token = p_token;
  END IF;
  
  RETURN token_valid;
END;
$$;

-- Create cleanup function for expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.obs_access_tokens 
  WHERE expires_at < now() - interval '7 days';
END;
$$;
