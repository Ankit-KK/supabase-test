-- Update the RLS policy for streamers_moderators to allow public access
-- since the app uses custom authentication, not Supabase Auth
DROP POLICY IF EXISTS "Streamers can manage their own moderators" ON public.streamers_moderators;

-- Create a new policy that allows anyone to manage moderators
-- The application logic will handle authorization
CREATE POLICY "Allow public access to streamers_moderators" 
ON public.streamers_moderators 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Also update the streamers table to allow public access for the same reason
DROP POLICY IF EXISTS "Streamers can manage their own data" ON public.streamers;

CREATE POLICY "Allow public access to streamers" 
ON public.streamers 
FOR ALL 
USING (true)
WITH CHECK (true);