-- Fix SECURITY DEFINER functions without fixed search_path

-- 1. Fix validate_donation_input function
CREATE OR REPLACE FUNCTION public.validate_donation_input(
  p_name text,
  p_amount numeric,
  p_message text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate name
  IF p_name IS NULL OR length(trim(p_name)) < 1 OR length(p_name) > 100 THEN
    RAISE EXCEPTION 'Invalid name: must be 1-100 characters';
  END IF;
  
  -- Validate amount
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 1000000 THEN
    RAISE EXCEPTION 'Invalid amount: must be between 1 and 1000000';
  END IF;
  
  -- Validate message if provided
  IF p_message IS NOT NULL AND length(p_message) > 500 THEN
    RAISE EXCEPTION 'Invalid message: must be 500 characters or less';
  END IF;
  
  RETURN true;
END;
$$;

-- 2. Fix sanitize_text_input function
CREATE OR REPLACE FUNCTION public.sanitize_text_input(p_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_input IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove potential XSS and SQL injection patterns
  RETURN regexp_replace(
    regexp_replace(p_input, '<[^>]*>', '', 'g'),
    '[\x00-\x1F\x7F]', '', 'g'
  );
END;
$$;

-- 3. Fix log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log security events (placeholder - can be extended to write to security_logs table)
  RAISE NOTICE 'Security Event: % - %', p_event_type, p_details::text;
END;
$$;

-- 4. Drop the old check_rate_limit function (superseded by check_rate_limit_v2)
DROP FUNCTION IF EXISTS public.check_rate_limit(text, text, integer, interval);