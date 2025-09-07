-- Secure donation payment information with robust access controls (Fixed)

-- First, let's add a security function to validate donation data
CREATE OR REPLACE FUNCTION public.validate_donation_insert(
  p_amount numeric,
  p_name text,
  p_message text DEFAULT NULL,
  p_streamer_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

-- Drop and recreate secure policies for ankit_donations
DROP POLICY IF EXISTS "Allow donation creation" ON public.ankit_donations;
DROP POLICY IF EXISTS "Admins can manage all ankit donations" ON public.ankit_donations;
DROP POLICY IF EXISTS "Admins can view all ankit donations" ON public.ankit_donations;
DROP POLICY IF EXISTS "Streamers can manage their ankit donations" ON public.ankit_donations;
DROP POLICY IF EXISTS "Streamers can view their donations" ON public.ankit_donations;
DROP POLICY IF EXISTS "System can update donation status" ON public.ankit_donations;

-- Deny all anonymous access to donation data
CREATE POLICY "Deny anonymous access to ankit_donations"
ON public.ankit_donations
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Allow secure donation creation with validation
CREATE POLICY "Allow validated donation creation"
ON public.ankit_donations
FOR INSERT
TO anon
WITH CHECK (
  public.validate_donation_insert(amount, name, message, streamer_id) AND
  payment_status = 'pending' AND
  moderation_status = 'pending'
);

-- Admin access to all donations
CREATE POLICY "Admins full access to ankit_donations"
ON public.ankit_donations
FOR ALL
TO authenticated
USING (public.is_admin_email(auth.email()))
WITH CHECK (public.is_admin_email(auth.email()));

-- Streamers can only view their own donations
CREATE POLICY "Streamers view own ankit_donations"
ON public.ankit_donations
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
);

-- Streamers can update moderation status only
CREATE POLICY "Streamers update moderation ankit_donations"
ON public.ankit_donations
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  ) AND
  -- Only allow updating specific columns, not financial data
  (OLD.amount = NEW.amount) AND 
  (OLD.order_id IS NOT DISTINCT FROM NEW.order_id) AND
  (OLD.cashfree_order_id IS NOT DISTINCT FROM NEW.cashfree_order_id)
);

-- Drop and recreate secure policies for chia_gaming_donations
DROP POLICY IF EXISTS "Allow donation creation" ON public.chia_gaming_donations;
DROP POLICY IF EXISTS "Admins can manage all chia gaming donations" ON public.chia_gaming_donations;
DROP POLICY IF EXISTS "Admins can view all chia gaming donations" ON public.chia_gaming_donations;
DROP POLICY IF EXISTS "Streamers can manage their donations" ON public.chia_gaming_donations;
DROP POLICY IF EXISTS "Streamers can view their donations" ON public.chia_gaming_donations;
DROP POLICY IF EXISTS "System can update donation status" ON public.chia_gaming_donations;

-- Deny all anonymous access
CREATE POLICY "Deny anonymous access to chia_gaming_donations"
ON public.chia_gaming_donations
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Allow secure donation creation
CREATE POLICY "Allow validated donation creation"
ON public.chia_gaming_donations
FOR INSERT
TO anon
WITH CHECK (
  public.validate_donation_insert(amount, name, message, streamer_id) AND
  payment_status = 'pending' AND
  moderation_status = 'pending'
);

-- Admin access
CREATE POLICY "Admins full access to chia_gaming_donations"
ON public.chia_gaming_donations
FOR ALL
TO authenticated
USING (public.is_admin_email(auth.email()))
WITH CHECK (public.is_admin_email(auth.email()));

-- Streamers view access
CREATE POLICY "Streamers view own chia_gaming_donations"
ON public.chia_gaming_donations
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
);

-- Streamers limited update access
CREATE POLICY "Streamers update moderation chia_gaming_donations"
ON public.chia_gaming_donations
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  ) AND
  (OLD.amount = NEW.amount) AND 
  (OLD.order_id IS NOT DISTINCT FROM NEW.order_id) AND
  (OLD.cashfree_order_id IS NOT DISTINCT FROM NEW.cashfree_order_id)
);

-- Drop and recreate secure policies for newstreamer_donations
DROP POLICY IF EXISTS "Allow donation creation" ON public.newstreamer_donations;
DROP POLICY IF EXISTS "Admins can manage all newstreamer donations" ON public.newstreamer_donations;
DROP POLICY IF EXISTS "Admins can view all newstreamer donations" ON public.newstreamer_donations;
DROP POLICY IF EXISTS "Streamers can manage their newstreamer donations" ON public.newstreamer_donations;
DROP POLICY IF EXISTS "Streamers can view their donations" ON public.newstreamer_donations;
DROP POLICY IF EXISTS "System can update donation status" ON public.newstreamer_donations;

-- Deny all anonymous access
CREATE POLICY "Deny anonymous access to newstreamer_donations"
ON public.newstreamer_donations
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Allow secure donation creation
CREATE POLICY "Allow validated donation creation"
ON public.newstreamer_donations
FOR INSERT
TO anon
WITH CHECK (
  public.validate_donation_insert(amount, name, message, streamer_id) AND
  payment_status = 'pending' AND
  moderation_status = 'pending'
);

-- Admin access
CREATE POLICY "Admins full access to newstreamer_donations"
ON public.newstreamer_donations
FOR ALL
TO authenticated
USING (public.is_admin_email(auth.email()))
WITH CHECK (public.is_admin_email(auth.email()));

-- Streamers view access
CREATE POLICY "Streamers view own newstreamer_donations"
ON public.newstreamer_donations
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
);

-- Streamers limited update access
CREATE POLICY "Streamers update moderation newstreamer_donations"
ON public.newstreamer_donations
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  ) AND
  (OLD.amount = NEW.amount) AND 
  (OLD.order_id IS NOT DISTINCT FROM NEW.order_id) AND
  (OLD.cashfree_order_id IS NOT DISTINCT FROM NEW.cashfree_order_id)
);