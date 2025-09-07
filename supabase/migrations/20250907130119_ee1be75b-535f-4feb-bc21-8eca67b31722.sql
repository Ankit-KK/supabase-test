-- Fix RLS policy for chia_gaming_donations to allow edge function insertion
-- The issue is that edge functions run with service role but RLS is blocking donation creation

-- Drop the restrictive policy that's blocking insertion
DROP POLICY IF EXISTS "Allow secure donation creation on chia_gaming_donations" ON public.chia_gaming_donations;

-- Create a new policy that allows service role and validates properly
CREATE POLICY "Allow donation creation from payment system"
ON public.chia_gaming_donations
FOR INSERT
WITH CHECK (
  -- Allow service role (edge functions) to insert donations
  (current_setting('role') = 'service_role') OR
  -- Or allow if validation passes for authenticated users
  (
    auth.uid() IS NOT NULL AND
    validate_donation_insert(amount, name, message, streamer_id) AND 
    payment_status = 'pending' AND 
    moderation_status = 'pending'
  )
);

-- Also ensure the validate_donation_insert function works properly
-- Let's check if we need to update it
CREATE OR REPLACE FUNCTION public.validate_donation_insert(p_amount numeric, p_name text, p_message text DEFAULT NULL::text, p_streamer_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Always allow service role to bypass validation
  IF current_setting('role') = 'service_role' THEN
    RETURN true;
  END IF;
  
  -- Validate amount
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000 THEN
    PERFORM public.log_security_violation('INVALID_DONATION_AMOUNT', 
      'Amount: ' || COALESCE(p_amount::text, 'NULL'));
    RETURN false;
  END IF;
  
  -- Validate name
  IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 OR LENGTH(p_name) > 100 THEN
    PERFORM public.log_security_violation('INVALID_DONOR_NAME', 
      'Name length: ' || COALESCE(LENGTH(p_name)::text, 'NULL'));
    RETURN false;
  END IF;
  
  -- Validate message if provided
  IF p_message IS NOT NULL AND LENGTH(p_message) > 500 THEN
    PERFORM public.log_security_violation('INVALID_DONATION_MESSAGE', 
      'Message length: ' || LENGTH(p_message)::text);
    RETURN false;
  END IF;
  
  -- Validate streamer exists
  IF p_streamer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.streamers WHERE id = p_streamer_id
  ) THEN
    PERFORM public.log_security_violation('INVALID_STREAMER_ID', 
      'Streamer ID: ' || p_streamer_id::text);
    RETURN false;
  END IF;
  
  -- Check for XSS attempts
  IF p_name ~* '<[^>]*>|javascript:|data:|vbscript:' OR 
     (p_message IS NOT NULL AND p_message ~* '<[^>]*>|javascript:|data:|vbscript:') THEN
    PERFORM public.log_security_violation('POTENTIAL_XSS_ATTEMPT', 
      'Suspicious content in donation data');
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;