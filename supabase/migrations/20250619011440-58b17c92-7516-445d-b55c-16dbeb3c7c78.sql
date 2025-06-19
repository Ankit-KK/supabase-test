
-- Enable RLS on chiaa_gaming_donations table
ALTER TABLE public.chiaa_gaming_donations ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user can access chiaa_gaming data
CREATE OR REPLACE FUNCTION public.can_access_chiaa_gaming_data()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.admin_users 
    WHERE user_email = auth.email() 
    AND admin_type = 'chiaa_gaming'
  );
$$;

-- Create policy for chiaa_gaming users to view their donations
CREATE POLICY "Chiaa Gaming can view donations"
  ON public.chiaa_gaming_donations
  FOR SELECT
  USING (public.can_access_chiaa_gaming_data());

-- Create policy for chiaa_gaming users to update their donations
CREATE POLICY "Chiaa Gaming can update donations"
  ON public.chiaa_gaming_donations
  FOR UPDATE
  USING (public.can_access_chiaa_gaming_data());

-- Create policy for public insert (for payment flow)
CREATE POLICY "Public can insert donations"
  ON public.chiaa_gaming_donations
  FOR INSERT
  WITH CHECK (true);

-- Create audit log table for tracking access
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admin can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (public.is_admin_user());

-- Create function to log access attempts
CREATE OR REPLACE FUNCTION public.log_access_attempt(
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_email,
    action,
    table_name,
    record_id,
    ip_address,
    user_agent
  ) VALUES (
    auth.email(),
    p_action,
    p_table_name,
    p_record_id,
    p_ip_address,
    p_user_agent
  );
END;
$$;

-- Create secure tokens table for OBS access
CREATE TABLE IF NOT EXISTS public.obs_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  admin_type text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_used_at timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Enable RLS on OBS tokens
ALTER TABLE public.obs_access_tokens ENABLE ROW LEVEL SECURITY;

-- Only the token owner can view their tokens
CREATE POLICY "Users can view their OBS tokens"
  ON public.obs_access_tokens
  FOR SELECT
  USING (admin_type IN (
    SELECT admin_type FROM public.admin_users WHERE user_email = auth.email()
  ));

-- Function to create secure OBS token
CREATE OR REPLACE FUNCTION public.create_obs_token(p_admin_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  -- Generate secure random token
  new_token := encode(gen_random_bytes(32), 'base64url');
  
  -- Invalidate existing tokens for this user/admin_type
  UPDATE public.obs_access_tokens 
  SET is_active = false 
  WHERE admin_type = p_admin_type AND is_active = true;
  
  -- Insert new token with 24 hour expiry
  INSERT INTO public.obs_access_tokens (token, admin_type, expires_at)
  VALUES (new_token, p_admin_type, now() + interval '24 hours');
  
  -- Log token creation
  PERFORM public.log_access_attempt('CREATE_OBS_TOKEN', 'obs_access_tokens');
  
  RETURN new_token;
END;
$$;

-- Function to validate OBS token
CREATE OR REPLACE FUNCTION public.validate_obs_token(p_token text, p_admin_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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
    
    -- Log token usage
    PERFORM public.log_access_attempt('USE_OBS_TOKEN', 'obs_access_tokens');
  ELSE
    -- Log failed token validation
    PERFORM public.log_access_attempt('INVALID_OBS_TOKEN', 'obs_access_tokens');
  END IF;
  
  RETURN token_valid;
END;
$$;

-- Clean up expired tokens function
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.obs_access_tokens 
  WHERE expires_at < now() - interval '7 days';
END;
$$;
