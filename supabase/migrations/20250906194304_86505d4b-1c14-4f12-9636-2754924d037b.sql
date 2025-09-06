-- Phase 1: Critical Database Security Fixes (Corrected)

-- 1. Fix infinite recursion in admin_emails RLS policy
-- First, create a security definer function to check admin status safely
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails 
    WHERE email = auth.email()
  );
$$;

-- Drop the existing problematic policy and recreate it safely
DROP POLICY IF EXISTS "Admins can manage admin emails" ON public.admin_emails;

CREATE POLICY "Admins can manage admin emails"
ON public.admin_emails
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- 2. Drop the public_streamers view if it exists (it's a security risk)
DROP VIEW IF EXISTS public.public_streamers;

-- 3. Add security functions for enhanced monitoring and validation
CREATE OR REPLACE FUNCTION public.log_security_violation(
  violation_type text,
  details text DEFAULT NULL,
  user_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_email,
    action,
    table_name,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(user_email, auth.email(), 'anonymous'),
    'SECURITY_VIOLATION: ' || violation_type,
    details,
    NULL, -- IP will be logged at application level
    'security-monitor'
  );
END;
$$;

-- 4. Create a function to validate streamer ownership more securely
CREATE OR REPLACE FUNCTION public.validate_streamer_ownership(p_streamer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.streamers 
    WHERE id = p_streamer_id 
    AND (user_id = auth.uid() OR public.is_current_user_admin())
  );
$$;

-- 5. Add enhanced validation for donation amounts and content
CREATE OR REPLACE FUNCTION public.validate_donation_security(
  p_amount numeric,
  p_name text,
  p_message text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate amount range
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000 THEN
    PERFORM public.log_security_violation('INVALID_DONATION_AMOUNT', 
      'Amount: ' || COALESCE(p_amount::text, 'NULL'));
    RETURN false;
  END IF;
  
  -- Validate name length and content
  IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 OR LENGTH(p_name) > 100 THEN
    PERFORM public.log_security_violation('INVALID_DONOR_NAME', 
      'Name length: ' || COALESCE(LENGTH(p_name)::text, 'NULL'));
    RETURN false;
  END IF;
  
  -- Validate message length if provided
  IF p_message IS NOT NULL AND LENGTH(p_message) > 500 THEN
    PERFORM public.log_security_violation('INVALID_DONATION_MESSAGE', 
      'Message length: ' || LENGTH(p_message)::text);
    RETURN false;
  END IF;
  
  -- Check for potential XSS or injection attempts
  IF p_name ~* '<[^>]*>|javascript:|data:|vbscript:' OR 
     (p_message IS NOT NULL AND p_message ~* '<[^>]*>|javascript:|data:|vbscript:') THEN
    PERFORM public.log_security_violation('POTENTIAL_XSS_ATTEMPT', 
      'Suspicious content detected');
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 6. Create server-side rate limiting function
CREATE OR REPLACE FUNCTION public.check_server_rate_limit(
  p_ip_address text,
  p_endpoint text,
  p_max_requests integer DEFAULT 10,
  p_window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Clean up old entries (older than 1 hour)
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
      PERFORM public.log_security_violation('RATE_LIMIT_EXCEEDED', 
        p_endpoint || ' from IP: ' || p_ip_address);
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