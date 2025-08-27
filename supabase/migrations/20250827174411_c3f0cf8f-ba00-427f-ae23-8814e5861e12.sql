-- Fix Security Definer View Issue
-- The public_streamers view must use SECURITY INVOKER to respect RLS policies

-- Drop the existing view that uses SECURITY DEFINER
DROP VIEW IF EXISTS public.public_streamers;

-- Recreate the view with SECURITY INVOKER to respect RLS policies
CREATE VIEW public.public_streamers 
WITH (security_invoker=on)
AS
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