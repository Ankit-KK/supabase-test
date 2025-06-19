
-- Fix search path vulnerabilities for all affected functions
-- This prevents search path injection attacks

-- Fix check_username_exists function
CREATE OR REPLACE FUNCTION public.check_username_exists(username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE username = username);
END;
$$;

-- Fix get_user_admin_type function
CREATE OR REPLACE FUNCTION public.get_user_admin_type()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT admin_type 
  FROM public.admin_users 
  WHERE user_email = auth.email()
  LIMIT 1;
$$;

-- Fix is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.admin_users 
    WHERE user_email = auth.email()
  );
$$;

-- Fix can_access_streamer_data function
CREATE OR REPLACE FUNCTION public.can_access_streamer_data(streamer_type text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.admin_users 
    WHERE user_email = auth.email() 
    AND (admin_type = streamer_type OR admin_type = 'admin')
  );
$$;

-- Fix can_access_chiaa_gaming_data function
CREATE OR REPLACE FUNCTION public.can_access_chiaa_gaming_data()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.admin_users 
    WHERE user_email = auth.email() 
    AND admin_type = 'chiaa_gaming'
  );
$$;

-- Fix log_access_attempt function
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
SET search_path = 'public'
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

-- Fix create_obs_token function
CREATE OR REPLACE FUNCTION public.create_obs_token(p_admin_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix validate_obs_token function
CREATE OR REPLACE FUNCTION public.validate_obs_token(p_token text, p_admin_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix cleanup_expired_tokens function
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.obs_access_tokens 
  WHERE expires_at < now() - interval '7 days';
END;
$$;

-- Fix validate_donation_input function
CREATE OR REPLACE FUNCTION public.validate_donation_input(
  p_name text, 
  p_message text, 
  p_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check for null or empty required fields
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Validate name length and characters
  IF length(p_name) > 100 OR p_name !~ '^[a-zA-Z0-9\s\-_\.]+$' THEN
    RETURN FALSE;
  END IF;
  
  -- Validate message length
  IF length(p_message) > 500 THEN
    RETURN FALSE;
  END IF;
  
  -- Validate amount
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Fix sanitize_text_input function
CREATE OR REPLACE FUNCTION public.sanitize_text_input(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN '';
  END IF;
  
  -- Remove potentially dangerous characters and limit length
  RETURN left(regexp_replace(trim(input_text), '[<>"\''&]', '', 'g'), 500);
END;
$$;

-- Fix log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text, 
  event_details text DEFAULT NULL, 
  ip_address text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_email,
    action,
    table_name,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(auth.email(), 'anonymous'),
    event_type,
    event_details,
    ip_address,
    'system'
  );
END;
$$;

-- Fix check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_address text, 
  p_endpoint text, 
  p_max_requests integer DEFAULT 10, 
  p_window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Clean up old entries
  DELETE FROM public.rate_limits 
  WHERE created_at < now() - INTERVAL '1 hour';
  
  -- Get current window start time
  window_start_time := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check if entry exists and is within window
  SELECT request_count, window_start INTO current_count, window_start_time
  FROM public.rate_limits
  WHERE ip_address = p_ip_address AND endpoint = p_endpoint;
  
  IF NOT FOUND THEN
    -- First request from this IP for this endpoint
    INSERT INTO public.rate_limits (ip_address, endpoint, request_count, window_start)
    VALUES (p_ip_address, p_endpoint, 1, now())
    ON CONFLICT (ip_address, endpoint) 
    DO UPDATE SET 
      request_count = 1,
      window_start = now();
    RETURN TRUE;
  END IF;
  
  -- Check if we're still in the same window
  IF window_start_time > now() - (p_window_minutes || ' minutes')::INTERVAL THEN
    -- Same window, check if under limit
    IF current_count >= p_max_requests THEN
      -- Log rate limit violation
      PERFORM public.log_security_event('RATE_LIMIT_EXCEEDED', p_endpoint, p_ip_address);
      RETURN FALSE;
    ELSE
      -- Increment counter
      UPDATE public.rate_limits 
      SET request_count = request_count + 1
      WHERE ip_address = p_ip_address AND endpoint = p_endpoint;
      RETURN TRUE;
    END IF;
  ELSE
    -- New window, reset counter
    UPDATE public.rate_limits 
    SET request_count = 1, window_start = now()
    WHERE ip_address = p_ip_address AND endpoint = p_endpoint;
    RETURN TRUE;
  END IF;
END;
$$;
