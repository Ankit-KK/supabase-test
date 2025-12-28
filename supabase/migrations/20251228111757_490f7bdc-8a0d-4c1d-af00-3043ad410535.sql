-- Create rate_limits table for tracking API request counts
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ip_address, endpoint)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON public.rate_limits(ip_address, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON public.rate_limits(created_at);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits FOR ALL
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

-- Create rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit_v2(
  p_ip_address TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  current_window_start TIMESTAMPTZ;
  window_duration INTERVAL;
BEGIN
  window_duration := (p_window_seconds || ' seconds')::INTERVAL;
  
  -- Clean up old entries (older than 1 hour)
  DELETE FROM public.rate_limits 
  WHERE created_at < now() - INTERVAL '1 hour';
  
  -- Try to get existing rate limit record
  SELECT request_count, window_start INTO current_count, current_window_start
  FROM public.rate_limits
  WHERE ip_address = p_ip_address AND endpoint = p_endpoint
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- First request from this IP for this endpoint
    INSERT INTO public.rate_limits (ip_address, endpoint, request_count, window_start)
    VALUES (p_ip_address, p_endpoint, 1, now())
    ON CONFLICT (ip_address, endpoint) DO UPDATE 
    SET request_count = 1, window_start = now();
    RETURN TRUE;
  END IF;
  
  -- Check if window has expired
  IF now() - current_window_start > window_duration THEN
    -- Reset counter for new window
    UPDATE public.rate_limits 
    SET request_count = 1, window_start = now()
    WHERE ip_address = p_ip_address AND endpoint = p_endpoint;
    RETURN TRUE;
  END IF;
  
  -- Check if under limit
  IF current_count >= p_max_requests THEN
    -- Rate limit exceeded
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  UPDATE public.rate_limits 
  SET request_count = request_count + 1
  WHERE ip_address = p_ip_address AND endpoint = p_endpoint;
  
  RETURN TRUE;
END;
$$;

-- Add account lockout columns to auth_users
ALTER TABLE public.auth_users 
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Create index for lockout checks
CREATE INDEX IF NOT EXISTS idx_auth_users_locked_until ON public.auth_users(locked_until) WHERE locked_until IS NOT NULL;

-- Add comment for documentation
COMMENT ON FUNCTION public.check_rate_limit_v2 IS 'Rate limiting function that checks and updates request counts per IP/endpoint';
COMMENT ON TABLE public.rate_limits IS 'Stores rate limiting data for API endpoints';
COMMENT ON COLUMN public.auth_users.failed_login_attempts IS 'Counter for failed login attempts';
COMMENT ON COLUMN public.auth_users.locked_until IS 'Timestamp until which the account is locked';