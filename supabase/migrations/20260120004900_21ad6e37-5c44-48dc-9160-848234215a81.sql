-- Drop the existing RESTRICTIVE policy
DROP POLICY IF EXISTS "Allow validated anonymous signups" ON user_signups;

-- Create a new PERMISSIVE INSERT policy with the same validation
CREATE POLICY "Allow validated anonymous signups"
ON user_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (name IS NOT NULL) AND 
  (length(TRIM(BOTH FROM name)) >= 1) AND 
  (length(TRIM(BOTH FROM name)) <= 100) AND 
  (email IS NOT NULL) AND 
  (length(TRIM(BOTH FROM email)) >= 5) AND 
  (length(TRIM(BOTH FROM email)) <= 255) AND 
  (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') AND 
  (mobile_number IS NOT NULL) AND 
  (length(TRIM(BOTH FROM mobile_number)) >= 8) AND 
  (length(TRIM(BOTH FROM mobile_number)) <= 20) AND 
  (mobile_number ~ '^[0-9+\-\s\(\)]+$') AND 
  ((youtube_channel IS NULL) OR (length(TRIM(BOTH FROM youtube_channel)) <= 500)) AND 
  ((instagram_handle IS NULL) OR (length(TRIM(BOTH FROM instagram_handle)) <= 100))
);