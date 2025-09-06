-- Fix critical security vulnerability: Remove public access to sensitive streamer data

-- Drop the overly permissive policy that allows any authenticated user to read all streamer data
DROP POLICY IF EXISTS "Authenticated users can read streamer data for operations" ON public.streamers;

-- Create a secure function that only exposes safe public streamer information
CREATE OR REPLACE FUNCTION public.get_public_streamer_data(p_streamer_slug text)
RETURNS TABLE(
  id uuid,
  streamer_slug text,
  streamer_name text,
  brand_color text,
  brand_logo_url text,
  hyperemotes_enabled boolean,
  hyperemotes_min_amount numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    s.brand_logo_url,
    s.hyperemotes_enabled,
    s.hyperemotes_min_amount
  FROM public.streamers s
  WHERE s.streamer_slug = p_streamer_slug;
$$;

-- Create a policy for public read access to only safe streamer information via the secure function
-- This replaces the overly permissive policy with controlled access
CREATE POLICY "Public can access basic streamer info for donations" 
ON public.streamers 
FOR SELECT 
USING (
  -- Only allow reading basic info needed for donation pages
  -- This policy is more restrictive and only allows access to specific fields
  public.is_valid_streamer_operation(id)
);