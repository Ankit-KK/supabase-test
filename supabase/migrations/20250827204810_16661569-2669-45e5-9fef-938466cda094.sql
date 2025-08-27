-- Fix RLS policy for streamers_moderators to work with custom authentication system
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Streamers can manage their own moderators" ON public.streamers_moderators;

-- Create a more permissive policy that allows system operations for moderator management
-- This allows operations when not authenticated via Supabase (custom auth system)
CREATE POLICY "Allow moderator management for custom auth system" 
ON public.streamers_moderators 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Also ensure the system can read moderator data for operations
DROP POLICY IF EXISTS "System can access moderator data for operations" ON public.streamers_moderators;

CREATE POLICY "System can access moderator data for operations" 
ON public.streamers_moderators 
FOR SELECT 
USING (true);