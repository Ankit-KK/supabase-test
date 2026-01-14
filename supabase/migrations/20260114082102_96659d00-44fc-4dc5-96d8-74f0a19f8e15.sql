-- Fix overly permissive UPDATE policies on streamers table
-- Drop the existing permissive UPDATE policies
DROP POLICY IF EXISTS "Allow authenticated users to update moderation settings" ON public.streamers;
DROP POLICY IF EXISTS "Allow goal updates" ON public.streamers;

-- Create a proper UPDATE policy that restricts to record owner or admin
CREATE POLICY "Streamers can update their own settings"
ON public.streamers
FOR UPDATE
USING (user_id = auth.uid() OR is_admin_user())
WITH CHECK (user_id = auth.uid() OR is_admin_user());

-- Also allow service role to manage all streamers
CREATE POLICY "Service role can manage all streamers"
ON public.streamers
FOR ALL
USING (current_setting('role', true) = 'service_role')
WITH CHECK (current_setting('role', true) = 'service_role');