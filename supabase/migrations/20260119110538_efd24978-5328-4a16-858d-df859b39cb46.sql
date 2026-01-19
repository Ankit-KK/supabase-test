-- Add INSERT policy for creating donations (allows donation page to insert)
CREATE POLICY "Anyone can create donations" 
ON public.chiaa_gaming_donations
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Add ALL policy for service role (allows webhooks and edge functions to manage donations)
CREATE POLICY "Service role can manage all donations"
ON public.chiaa_gaming_donations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);