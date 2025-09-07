-- Fix Security Definer View vulnerability

-- Drop the insecure view that bypasses RLS
DROP VIEW IF EXISTS public.safe_streamers_view;

-- The view was providing "safe" access to streamer data, but it bypassed RLS policies
-- We already have secure functions like get_streamer_for_donation() and get_public_streamer_data()
-- that provide the same functionality with proper security controls

-- Log security fix
INSERT INTO public.audit_logs (action, table_name, user_email, ip_address, user_agent)
VALUES (
  'SECURITY_FIX', 
  'safe_streamers_view', 
  'system@lovable.dev',
  'system',
  'Lovable Security Scanner - Removed security definer view that bypassed RLS'
);