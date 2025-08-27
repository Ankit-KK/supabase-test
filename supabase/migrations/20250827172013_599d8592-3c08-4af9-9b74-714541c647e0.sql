-- Fix OBS Token Security Vulnerability
-- Remove public read access to obs_tokens table and create secure token validation

-- Drop the insecure public policy that exposes all active tokens
DROP POLICY IF EXISTS "Public can view active tokens for alerts" ON public.obs_tokens;

-- Create a secure function to validate OBS tokens without exposing all tokens
CREATE OR REPLACE FUNCTION public.validate_obs_token(token_to_check text)
RETURNS TABLE(
  streamer_id uuid,
  streamer_slug text,
  streamer_name text,
  brand_color text,
  brand_logo_url text,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
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

-- Update the existing function to use the new secure approach
CREATE OR REPLACE FUNCTION public.get_streamer_by_obs_token_v2(token text)
 RETURNS TABLE(id uuid, user_id uuid, streamer_slug text, streamer_name text, brand_color text, brand_logo_url text, obs_token text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    s.brand_logo_url,
    ot.token as obs_token
  FROM public.streamers s
  INNER JOIN public.obs_tokens ot ON s.id = ot.streamer_id
  WHERE ot.token = get_streamer_by_obs_token_v2.token 
    AND ot.is_active = true
    AND (ot.expires_at IS NULL OR ot.expires_at > now());
END;
$function$;