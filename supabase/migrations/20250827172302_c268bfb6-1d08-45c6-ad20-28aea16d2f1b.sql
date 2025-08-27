-- Fix Page Visits Privacy Vulnerability
-- Remove public read access to page_visits table containing sensitive user data

-- Drop the insecure public read policy that exposes user IP addresses and user agents
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.page_visits;

-- Create admin-only read access policy for page visits data
CREATE POLICY "Admin only read access to page visits" 
ON public.page_visits 
FOR SELECT 
TO authenticated
USING (public.is_admin_user());

-- Ensure visitor stats functions remain accessible through SECURITY DEFINER
-- These functions are already SECURITY DEFINER so they bypass RLS and will continue working
-- Update the visitor stats functions to add proper access control checks
CREATE OR REPLACE FUNCTION public.get_visitor_stats()
 RETURNS TABLE(total_visits bigint, unique_visitors bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Only return stats if user is admin, otherwise return null
  SELECT 
    CASE WHEN public.is_admin_user() THEN COUNT(*)::bigint ELSE NULL::bigint END AS total_visits,
    CASE WHEN public.is_admin_user() THEN COUNT(DISTINCT ip_address)::bigint ELSE NULL::bigint END AS unique_visitors
  FROM public.page_visits;
$function$;

CREATE OR REPLACE FUNCTION public.get_page_visitor_stats(page text)
 RETURNS TABLE(total_visits bigint, unique_visitors bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Only return stats if user is admin, otherwise return null
  SELECT 
    CASE WHEN public.is_admin_user() THEN COUNT(*)::bigint ELSE NULL::bigint END AS total_visits,
    CASE WHEN public.is_admin_user() THEN COUNT(DISTINCT ip_address)::bigint ELSE NULL::bigint END AS unique_visitors
  FROM public.page_visits
  WHERE page_path = page;
$function$;