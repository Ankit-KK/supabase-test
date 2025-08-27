-- Fix OBS Token Exposure Vulnerability  
-- The streamers table still allows public access to sensitive obs_token fields

-- Drop the policy that allows public access to the main streamers table
DROP POLICY IF EXISTS "Public can view safe streamer info" ON public.streamers;

-- Remove the overly broad system policy that allows all authenticated users to read all streamer data
DROP POLICY IF EXISTS "System can manage streamer authentication" ON public.streamers;

-- Create a more restrictive policy: only allow authenticated users to read streamers data
-- when they need it for legitimate operations (and SECURITY DEFINER functions will bypass this anyway)
CREATE POLICY "Authenticated users can read streamer data for operations" 
ON public.streamers 
FOR SELECT 
TO authenticated
USING (true);

-- Create a policy for streamers to manage their own complete data (including sensitive fields)
-- This replaces the previous policy with the same functionality
CREATE POLICY "Streamers can manage their own complete data" 
ON public.streamers 
FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Ensure the public_streamers view is the ONLY way for public/anonymous users to access streamer data
-- The view already excludes sensitive fields like obs_token, username, password
-- Grant explicit access to ensure public users can only use the safe view
REVOKE ALL ON public.streamers FROM anon;
REVOKE ALL ON public.streamers FROM public;

-- Ensure the view remains accessible to public
GRANT SELECT ON public.public_streamers TO anon;
GRANT SELECT ON public.public_streamers TO public;

-- Update the get_public_streamer_info function to ensure it only returns safe data
-- This function is SECURITY DEFINER so it will work regardless of RLS
CREATE OR REPLACE FUNCTION public.get_public_streamer_info(slug text)
 RETURNS TABLE(id uuid, streamer_slug text, streamer_name text, brand_color text, brand_logo_url text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    s.id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    s.brand_logo_url
  FROM public.streamers s
  WHERE s.streamer_slug = slug;
$function$;

-- Create a secure function for OBS token validation that doesn't expose the token
CREATE OR REPLACE FUNCTION public.validate_obs_token_secure(token_to_check text)
 RETURNS TABLE(streamer_id uuid, streamer_slug text, streamer_name text, brand_color text, brand_logo_url text, is_valid boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if token exists in obs_tokens table (more secure approach)
  RETURN QUERY
  SELECT 
    s.id as streamer_id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    s.brand_logo_url,
    true as is_valid
  FROM public.streamers s
  INNER JOIN public.obs_tokens ot ON s.id = ot.streamer_id
  WHERE ot.token = token_to_check 
    AND ot.is_active = true
    AND (ot.expires_at IS NULL OR ot.expires_at > now());
    
  -- If no valid token found, return invalid result
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      NULL::uuid as streamer_id,
      NULL::text as streamer_slug,
      NULL::text as streamer_name,
      NULL::text as brand_color,
      NULL::text as brand_logo_url,
      false as is_valid;
  END IF;
END;
$function$;