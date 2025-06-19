
-- Phase 1: Fix RLS Policies - Remove overly permissive policies and add secure ones

-- First, drop existing overly permissive policies on donation tables
DROP POLICY IF EXISTS "Allow public read access to donation_gifs" ON public.donation_gifs;
DROP POLICY IF EXISTS "Allow public insert to donation_gifs" ON public.donation_gifs;
DROP POLICY IF EXISTS "Allow public update to donation_gifs" ON public.donation_gifs;

-- Create secure RLS policies for donation_gifs (only authenticated users)
CREATE POLICY "Authenticated users can read donation_gifs" 
  ON public.donation_gifs 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert donation_gifs" 
  ON public.donation_gifs 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update donation_gifs" 
  ON public.donation_gifs 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Add RLS to donation tables if not already enabled
ALTER TABLE public.chiaa_gaming_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ankit_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create secure policies for chiaa_gaming_donations
CREATE POLICY "Authenticated users can read chiaa_gaming_donations" 
  ON public.chiaa_gaming_donations 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Public can insert chiaa_gaming_donations" 
  ON public.chiaa_gaming_donations 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (
    payment_status = 'pending' AND
    length(name) <= 100 AND
    length(message) <= 500 AND
    amount > 0 AND
    amount <= 100000
  );

-- Create secure policies for ankit_donations
CREATE POLICY "Authenticated users can read ankit_donations" 
  ON public.ankit_donations 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Public can insert ankit_donations" 
  ON public.ankit_donations 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (
    payment_status = 'pending' AND
    length(name) <= 100 AND
    length(message) <= 500 AND
    amount > 0 AND
    amount <= 100000
  );

-- Secure admin_users table - only authenticated users can read their own data
CREATE POLICY "Users can read own admin data" 
  ON public.admin_users 
  FOR SELECT 
  TO authenticated 
  USING (user_email = auth.email());

-- Create input validation functions to prevent SQL injection
CREATE OR REPLACE FUNCTION public.validate_donation_input(
  p_name TEXT,
  p_message TEXT,
  p_amount NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create function to sanitize text input
CREATE OR REPLACE FUNCTION public.sanitize_text_input(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN '';
  END IF;
  
  -- Remove potentially dangerous characters and limit length
  RETURN left(regexp_replace(trim(input_text), '[<>"\''&]', '', 'g'), 500);
END;
$$;

-- Create audit logging function for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  event_details TEXT DEFAULT NULL,
  ip_address TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Add rate limiting table for preventing abuse
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ip_address, endpoint)
);

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow public access to rate_limits for checking and inserting
CREATE POLICY "Public can manage rate limits" 
  ON public.rate_limits 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

-- Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_address TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
