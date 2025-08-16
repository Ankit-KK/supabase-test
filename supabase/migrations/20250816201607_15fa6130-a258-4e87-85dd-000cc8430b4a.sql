-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Streamers can create their own tokens" ON obs_tokens;
DROP POLICY IF EXISTS "Streamers can update their own tokens" ON obs_tokens;
DROP POLICY IF EXISTS "obs_tokens_insert_owned_or_unassigned" ON obs_tokens;
DROP POLICY IF EXISTS "obs_tokens_update_owned_or_unassigned" ON obs_tokens;
DROP POLICY IF EXISTS "obs_tokens_select_owned_or_unassigned" ON obs_tokens;

-- Create simple policies that allow streamers to manage their tokens
CREATE POLICY "Allow token operations for valid streamers" 
ON obs_tokens 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM streamers s 
    WHERE s.id = obs_tokens.streamer_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM streamers s 
    WHERE s.id = obs_tokens.streamer_id
  )
);

-- Keep the public read policy for active tokens (needed for alerts page)
-- This policy already exists: "Public can view active tokens for alerts"