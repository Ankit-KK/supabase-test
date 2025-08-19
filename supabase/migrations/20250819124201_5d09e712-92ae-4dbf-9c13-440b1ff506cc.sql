-- Fix RLS policy for obs_tokens to allow streamers to manage their own tokens
DROP POLICY IF EXISTS "Allow token operations for valid streamers" ON public.obs_tokens;
DROP POLICY IF EXISTS "Streamers can view their own tokens" ON public.obs_tokens;

-- Create proper RLS policies for obs_tokens
CREATE POLICY "Streamers can manage their own tokens" 
ON public.obs_tokens 
FOR ALL 
USING (streamer_id IN (
  SELECT s.id FROM public.streamers s WHERE s.user_id = auth.uid()
))
WITH CHECK (streamer_id IN (
  SELECT s.id FROM public.streamers s WHERE s.user_id = auth.uid()
));

-- Allow public to view active tokens for OBS alerts
CREATE POLICY "Public can view active tokens for alerts" 
ON public.obs_tokens 
FOR SELECT 
USING (is_active = true);