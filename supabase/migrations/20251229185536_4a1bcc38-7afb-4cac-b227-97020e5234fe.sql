-- Add explicit deny policies for rate_limits table to ensure only service role can access

-- Drop the existing policy and recreate with better naming
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Create explicit deny policy for anonymous users
CREATE POLICY "Deny anonymous access to rate_limits"
ON public.rate_limits
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Create explicit deny policy for authenticated users
CREATE POLICY "Deny authenticated access to rate_limits"
ON public.rate_limits
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Recreate service role policy (service_role bypasses RLS by default, but explicit is clearer)
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);