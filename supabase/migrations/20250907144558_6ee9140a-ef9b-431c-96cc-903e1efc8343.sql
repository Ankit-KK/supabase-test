-- Allow service role to update payment status for donations
-- This is needed for payment verification edge functions

CREATE POLICY IF NOT EXISTS "Service role can update payment status" 
ON chia_gaming_donations 
FOR UPDATE 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

-- Also allow service role to update ankit_donations
CREATE POLICY IF NOT EXISTS "Service role can update payment status ankit" 
ON ankit_donations 
FOR UPDATE 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

-- Allow service role to update newstreamer_donations
CREATE POLICY IF NOT EXISTS "Service role can update payment status newstreamer" 
ON newstreamer_donations 
FOR UPDATE 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');