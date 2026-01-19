-- Grant SELECT privilege to anon and authenticated roles
-- This allows the RLS policies to work correctly for the dashboard
GRANT SELECT ON public.chiaa_gaming_donations TO anon;
GRANT SELECT ON public.chiaa_gaming_donations TO authenticated;