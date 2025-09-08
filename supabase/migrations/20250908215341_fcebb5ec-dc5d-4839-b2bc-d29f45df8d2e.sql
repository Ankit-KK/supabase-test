-- Fix user_signups RLS policies to allow anonymous signup
-- The current "Deny direct access to signups" policy is blocking all access

-- Drop the overly restrictive policy that blocks everything
DROP POLICY IF EXISTS "Deny direct access to signups" ON public.user_signups;

-- Ensure the anonymous signup policy is properly configured
DROP POLICY IF EXISTS "Allow anonymous signup creation" ON public.user_signups;

-- Create a new, properly configured anonymous signup policy
CREATE POLICY "Allow anonymous user signups" ON public.user_signups
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  -- Validate name
  name IS NOT NULL 
  AND length(TRIM(name)) >= 1 
  AND length(TRIM(name)) <= 100
  -- Validate email
  AND email IS NOT NULL 
  AND length(TRIM(email)) >= 5 
  AND length(TRIM(email)) <= 255 
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  -- Validate mobile number
  AND mobile_number IS NOT NULL 
  AND length(TRIM(mobile_number)) >= 8 
  AND length(TRIM(mobile_number)) <= 20 
  AND mobile_number ~ '^[0-9+\-\s\(\)]+$'
  -- Validate optional fields
  AND (youtube_channel IS NULL OR length(TRIM(youtube_channel)) <= 500)
  AND (instagram_handle IS NULL OR length(TRIM(instagram_handle)) <= 100)
);