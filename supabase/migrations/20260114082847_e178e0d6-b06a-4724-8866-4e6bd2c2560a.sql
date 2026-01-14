-- Fix user_signups table to properly protect PII
-- Drop existing policies
DROP POLICY IF EXISTS "Deny all read and modify access" ON public.user_signups;
DROP POLICY IF EXISTS "Allow anonymous signup creation only" ON public.user_signups;

-- Create explicit DENY policies for SELECT (restrictive - takes precedence)
CREATE POLICY "Deny anonymous and authenticated SELECT"
ON public.user_signups
FOR SELECT
TO anon, authenticated
USING (false);

-- Allow only service role to read user signups data
CREATE POLICY "Service role can read user signups"
ON public.user_signups
FOR SELECT
USING (current_setting('role', true) = 'service_role');

-- Allow anonymous INSERT with strict validation (for signup form)
CREATE POLICY "Allow validated anonymous signups"
ON public.user_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Name validation
  name IS NOT NULL 
  AND length(TRIM(BOTH FROM name)) >= 1 
  AND length(TRIM(BOTH FROM name)) <= 100
  -- Email validation
  AND email IS NOT NULL 
  AND length(TRIM(BOTH FROM email)) >= 5 
  AND length(TRIM(BOTH FROM email)) <= 255
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  -- Mobile validation
  AND mobile_number IS NOT NULL 
  AND length(TRIM(BOTH FROM mobile_number)) >= 8 
  AND length(TRIM(BOTH FROM mobile_number)) <= 20
  AND mobile_number ~ '^[0-9+\-\s\(\)]+$'
  -- Optional fields validation
  AND (youtube_channel IS NULL OR length(TRIM(BOTH FROM youtube_channel)) <= 500)
  AND (instagram_handle IS NULL OR length(TRIM(BOTH FROM instagram_handle)) <= 100)
);

-- Deny UPDATE and DELETE for regular users
CREATE POLICY "Deny user UPDATE on user_signups"
ON public.user_signups
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "Deny user DELETE on user_signups"
ON public.user_signups
FOR DELETE
TO anon, authenticated
USING (false);

-- Service role can manage all records
CREATE POLICY "Service role can manage user signups"
ON public.user_signups
FOR ALL
USING (current_setting('role', true) = 'service_role')
WITH CHECK (current_setting('role', true) = 'service_role');