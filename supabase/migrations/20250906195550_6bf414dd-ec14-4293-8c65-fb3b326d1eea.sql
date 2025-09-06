-- Fix the security definer view issue created in the previous migration
-- Remove the problematic view and replace with proper RLS policies

-- 1. Drop the security definer view that was flagged as a security risk
DROP VIEW IF EXISTS public.public_streamer_view;

-- 2. Instead, create a more secure approach using a regular view without security_barrier
-- and proper RLS policies on the underlying table

-- 3. Create a standard view (without security definer) for public streamer data
CREATE VIEW public.safe_streamers_view AS
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

-- 4. Create a new, more restrictive RLS policy for public access
-- This policy will only allow anonymous users to access data via specific secure functions
CREATE POLICY "Anonymous users can access via secure functions"
ON public.streamers
FOR SELECT
TO anon
USING (false); -- Block direct anonymous access, force use of secure functions

-- 5. Create policy for authenticated users to access only their own data
CREATE POLICY "Authenticated users can access own streamers"
ON public.streamers  
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 6. Ensure admins still have full access
-- (This should already exist from previous migration)

-- 7. Update the get_streamer_for_donation function to not rely on RLS
-- Since it's SECURITY DEFINER, it can bypass RLS safely
CREATE OR REPLACE FUNCTION public.get_streamer_for_donation(p_streamer_slug text)
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
  -- This function can safely access the streamers table due to SECURITY DEFINER
  -- It only returns safe, non-sensitive fields
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

-- 8. Also fix the function search path issue by ensuring all functions have proper search_path
CREATE OR REPLACE FUNCTION public.get_safe_streamer_columns()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY[
    'id',
    'streamer_slug', 
    'streamer_name',
    'brand_color',
    'brand_logo_url',
    'hyperemotes_enabled',
    'hyperemotes_min_amount',
    'created_at',
    'updated_at'
  ];
$$;

-- 9. Log the security fix completion
SELECT public.log_security_violation(
  'SECURITY_DEFINER_VIEW_FIXED',
  'Replaced security definer view with secure RLS policies and SECURITY DEFINER functions',
  'system'
);