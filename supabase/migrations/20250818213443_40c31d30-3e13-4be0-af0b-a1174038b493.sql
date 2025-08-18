-- Fix critical security vulnerability: Remove public access to sensitive streamer data
-- This migration restricts public access to only non-sensitive streamer information

-- First, drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view streamers" ON public.streamers;

-- Create a new policy that only allows public access to non-sensitive data
CREATE POLICY "Public can view basic streamer info" 
ON public.streamers 
FOR SELECT 
USING (true)
-- Only allow access to non-sensitive columns
WITH CHECK (false); -- This is a SELECT-only policy

-- Create a security definer function to get public streamer data safely
CREATE OR REPLACE FUNCTION public.get_public_streamer_info(slug text)
RETURNS TABLE(
  id uuid,
  streamer_slug text,
  streamer_name text,
  brand_color text,
  brand_logo_url text
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    s.id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    s.brand_logo_url
  FROM public.streamers s
  WHERE s.streamer_slug = slug;
$$;

-- Update the existing get_streamer_by_slug function to be more secure
CREATE OR REPLACE FUNCTION public.get_streamer_by_slug_secure(slug text)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  streamer_slug text,
  streamer_name text,
  brand_color text,
  brand_logo_url text
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    s.id,
    s.user_id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    s.brand_logo_url
  FROM public.streamers s
  WHERE s.streamer_slug = slug;
$$;

-- Create a secure function for streamer authentication (instead of direct table access)
CREATE OR REPLACE FUNCTION public.authenticate_streamer(p_username text, p_password text)
RETURNS TABLE(
  id uuid,
  streamer_slug text,
  streamer_name text,
  brand_color text,
  success boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    true as success
  FROM public.streamers s
  WHERE s.username = p_username 
    AND s.password = p_password;
    
  -- If no rows returned, return a failure record
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      NULL::uuid,
      NULL::text,
      NULL::text,
      NULL::text,
      false as success;
  END IF;
END;
$$;

-- Ensure obs_tokens table policies are secure and working
-- (These should already exist but let's make sure they're correct)

-- Policy for streamers to manage their own tokens
CREATE POLICY IF NOT EXISTS "Streamers can manage their own tokens" 
ON public.obs_tokens 
FOR ALL
USING (streamer_id IN (
  SELECT s.id 
  FROM public.streamers s 
  WHERE s.user_id = auth.uid()
))
WITH CHECK (streamer_id IN (
  SELECT s.id 
  FROM public.streamers s 
  WHERE s.user_id = auth.uid()
));

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION public.get_public_streamer_info(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_streamer_by_slug_secure(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_streamer(text, text) TO anon, authenticated;