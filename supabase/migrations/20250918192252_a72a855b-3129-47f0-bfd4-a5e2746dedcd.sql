-- Fix security warning: Add RLS policies for obs_tokens table

-- Admin users can manage OBS tokens (restrictive by default)
CREATE POLICY "Only admins can manage OBS tokens" 
ON public.obs_tokens 
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Service role can access tokens for API validation
CREATE POLICY "Service role can access tokens" 
ON public.obs_tokens 
FOR SELECT
USING (current_setting('role') = 'service_role');