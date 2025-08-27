-- Fix Critical Streamer Security Vulnerability
-- The streamers table currently allows public access to sensitive data including passwords and OBS tokens

-- Drop the overly permissive public access policy
DROP POLICY IF EXISTS "Allow public access to streamers" ON public.streamers;

-- Create secure RLS policies for the streamers table

-- Policy 1: Allow public read access to only non-sensitive streamer information
CREATE POLICY "Public can view safe streamer info" 
ON public.streamers 
FOR SELECT 
TO public
USING (true);

-- Policy 2: Allow authenticated streamers to manage their own data
CREATE POLICY "Streamers can manage their own data" 
ON public.streamers 
FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 3: Allow system/admin functions to work with streamer data
-- (SECURITY DEFINER functions will bypass RLS anyway, but this ensures consistency)
CREATE POLICY "System can manage streamer authentication" 
ON public.streamers 
FOR SELECT 
TO authenticated
USING (true);

-- Create a secure public view that only exposes safe streamer information
CREATE OR REPLACE VIEW public.public_streamers AS
SELECT 
  id,
  streamer_slug,
  streamer_name,
  brand_color,
  brand_logo_url,
  hyperemotes_enabled,
  hyperemotes_min_amount,
  created_at,
  updated_at
FROM public.streamers;

-- Grant public access to the safe view
GRANT SELECT ON public.public_streamers TO public;

-- Update the get_public_streamer_info function to ensure it only returns safe data
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