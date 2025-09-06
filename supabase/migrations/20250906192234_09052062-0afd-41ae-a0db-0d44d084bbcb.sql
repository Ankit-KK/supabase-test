-- Phase 1: Critical Database Security Fixes

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

-- 2. Secure the public_streamers table by enabling RLS and adding proper policies
ALTER TABLE public.public_streamers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to basic streamer info (this appears to be intentional)
CREATE POLICY "Public can view streamer info"
ON public.public_streamers
FOR SELECT
USING (true);

-- Only admins can manage public streamer entries
CREATE POLICY "Only admins can manage public streamers"
ON public.public_streamers
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- 3. Add additional security functions for rate limiting and monitoring
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

-- 5. Add enhanced validation for donation amounts
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