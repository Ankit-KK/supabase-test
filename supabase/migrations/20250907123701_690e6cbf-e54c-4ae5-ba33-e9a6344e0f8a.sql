-- Fix authentication token security by strengthening RLS policies

-- Drop existing policies on obs_tokens
DROP POLICY IF EXISTS "Streamers can manage their own tokens" ON public.obs_tokens;

-- Drop existing policies on streamers_auth_emails  
DROP POLICY IF EXISTS "Admins manage all auth emails" ON public.streamers_auth_emails;
DROP POLICY IF EXISTS "Owners manage their auth emails" ON public.streamers_auth_emails;

-- Create secure RLS policies for obs_tokens
-- Deny all anonymous access to tokens
CREATE POLICY "Deny anonymous access to obs_tokens"
ON public.obs_tokens
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Only allow authenticated streamers to view/manage their own tokens
CREATE POLICY "Streamers can view their own tokens"
ON public.obs_tokens
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
);

-- Allow streamers to insert tokens for their own streams
CREATE POLICY "Streamers can create their own tokens"
ON public.obs_tokens
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
);

-- Allow streamers to update their own tokens (for regeneration)
CREATE POLICY "Streamers can update their own tokens"
ON public.obs_tokens
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
);

-- Allow streamers to delete their own tokens
CREATE POLICY "Streamers can delete their own tokens"
ON public.obs_tokens
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
);

-- Admin access to all tokens (for support purposes)
CREATE POLICY "Admins can manage all obs_tokens"
ON public.obs_tokens
FOR ALL
TO authenticated
USING (public.is_admin_email(auth.email()))
WITH CHECK (public.is_admin_email(auth.email()));

-- Create secure RLS policies for streamers_auth_emails
-- Deny all anonymous access
CREATE POLICY "Deny anonymous access to auth_emails"
ON public.streamers_auth_emails
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Only allow authenticated users to view auth emails for their own streamers
CREATE POLICY "Streamers can view their own auth_emails"
ON public.streamers_auth_emails
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
);

-- Allow streamers to add auth emails for their own streams
CREATE POLICY "Streamers can add their own auth_emails"
ON public.streamers_auth_emails
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
);

-- Allow streamers to update auth emails for their own streams
CREATE POLICY "Streamers can update their own auth_emails"
ON public.streamers_auth_emails
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
);

-- Allow streamers to delete auth emails for their own streams
CREATE POLICY "Streamers can delete their own auth_emails"
ON public.streamers_auth_emails
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM public.streamers s 
    WHERE s.user_id = auth.uid()
  )
);

-- Admin access to all auth emails
CREATE POLICY "Admins can manage all auth_emails"
ON public.streamers_auth_emails
FOR ALL
TO authenticated
USING (public.is_admin_email(auth.email()))
WITH CHECK (public.is_admin_email(auth.email()));

-- Add security logging for token access
CREATE OR REPLACE FUNCTION public.log_obs_token_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all access to OBS tokens for security monitoring
  PERFORM public.log_sensitive_access(
    'obs_tokens',
    TG_OP,
    COALESCE(NEW.id, OLD.id)
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for OBS token access logging
DROP TRIGGER IF EXISTS log_obs_token_access_trigger ON public.obs_tokens;
CREATE TRIGGER log_obs_token_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.obs_tokens
  FOR EACH ROW EXECUTE FUNCTION public.log_obs_token_access();

-- Add security logging for auth email access  
CREATE OR REPLACE FUNCTION public.log_auth_email_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all access to auth emails for security monitoring
  PERFORM public.log_sensitive_access(
    'streamers_auth_emails',
    TG_OP,
    COALESCE(NEW.id, OLD.id)
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth email access logging
DROP TRIGGER IF EXISTS log_auth_email_access_trigger ON public.streamers_auth_emails;
CREATE TRIGGER log_auth_email_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.streamers_auth_emails
  FOR EACH ROW EXECUTE FUNCTION public.log_auth_email_access();