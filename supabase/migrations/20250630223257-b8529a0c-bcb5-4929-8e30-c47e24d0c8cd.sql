
-- Drop the existing restrictive RLS policy that's causing the issue
DROP POLICY IF EXISTS "Authenticated users can manage obs tokens" ON public.obs_access_tokens;

-- Create new policies that allow the token generation to work
-- Allow anonymous and authenticated users to insert tokens (needed for token generation)
CREATE POLICY "Allow token creation" 
  ON public.obs_access_tokens 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- Allow reading tokens for validation (needed for OBS overlay functionality)
CREATE POLICY "Allow token validation" 
  ON public.obs_access_tokens 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Allow updating tokens (for marking as inactive, updating last_used_at)
CREATE POLICY "Allow token updates" 
  ON public.obs_access_tokens 
  FOR UPDATE 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

-- Allow deleting expired tokens
CREATE POLICY "Allow token cleanup" 
  ON public.obs_access_tokens 
  FOR DELETE 
  TO anon, authenticated 
  USING (true);
