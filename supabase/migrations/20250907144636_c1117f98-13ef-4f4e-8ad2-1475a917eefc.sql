-- Allow service role to update payment status for donations
-- This is needed for payment verification edge functions

-- Drop existing conflicting policies first (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Service role can update payment status" ON chia_gaming_donations;
DROP POLICY IF EXISTS "Service role can update payment status ankit" ON ankit_donations;
DROP POLICY IF EXISTS "Service role can update payment status newstreamer" ON newstreamer_donations;

-- Create new policies for service role updates
CREATE POLICY "Service role can update payment status" 
ON chia_gaming_donations 
FOR UPDATE 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Service role can update payment status ankit" 
ON ankit_donations 
FOR UPDATE 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Service role can update payment status newstreamer" 
ON newstreamer_donations 
FOR UPDATE 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');