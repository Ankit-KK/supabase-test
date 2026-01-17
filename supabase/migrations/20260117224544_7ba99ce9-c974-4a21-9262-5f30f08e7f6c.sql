-- Fix overly permissive RLS policies that use USING (true) or WITH CHECK (true)
-- Using TO role_name with USING (true) is the correct pattern for service role policies

-- 1. Fix auth_users service role policy
DROP POLICY IF EXISTS "Service role can manage all auth users" ON public.auth_users;
CREATE POLICY "Service role can manage all auth users"
ON public.auth_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Fix bongflick_donations service role policy  
DROP POLICY IF EXISTS "Service role can manage all donations" ON public.bongflick_donations;
CREATE POLICY "Service role can manage all donations"
ON public.bongflick_donations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Fix rate_limits service role policy
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Fix visits anonymous insert policy - restrict to only valid IP patterns
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.visits;
CREATE POLICY "Allow anonymous insert"
ON public.visits
FOR INSERT
TO anon
WITH CHECK (
  -- Basic validation: IP address must be non-empty and reasonably formatted
  ip_address IS NOT NULL 
  AND length(ip_address) >= 7  -- Minimum valid IP like "1.1.1.1"
  AND length(ip_address) <= 45 -- Maximum for IPv6
);