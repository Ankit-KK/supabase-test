-- Remove all read access to user_signups table
-- Keep only INSERT access for anonymous signups

-- Drop existing admin access policy that allows reading
DROP POLICY IF EXISTS "Admin access with mandatory audit logging" ON public.user_signups;

-- Drop any other existing policies
DROP POLICY IF EXISTS "Allow anonymous user signups" ON public.user_signups;

-- Create new INSERT-only policy for anonymous signups
CREATE POLICY "Allow anonymous signup creation only" ON public.user_signups
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

-- Explicitly deny all SELECT, UPDATE, DELETE operations
CREATE POLICY "Deny all read and modify access" ON public.user_signups
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);