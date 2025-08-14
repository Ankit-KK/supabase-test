-- Drop all RLS policies that depend on functions first
DROP POLICY IF EXISTS "Streamers can view their contracts" ON public.streamer_contracts;
DROP POLICY IF EXISTS "Admin can view all contracts" ON public.streamer_contracts;
DROP POLICY IF EXISTS "Admin can insert contracts" ON public.streamer_contracts;
DROP POLICY IF EXISTS "Admin can update contracts" ON public.streamer_contracts;
DROP POLICY IF EXISTS "Admin users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can read own admin data" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view their own admin data" ON public.admin_users;
DROP POLICY IF EXISTS "Admin can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admin can manage custom sounds" ON public.custom_sound_alerts;
DROP POLICY IF EXISTS "Admin can manage donation gifs" ON public.donation_gifs;
DROP POLICY IF EXISTS "Admin can manage moderators" ON public.moderators;
DROP POLICY IF EXISTS "Admins can view moderators" ON public.moderators;

-- Drop all streamer-related functions
DROP FUNCTION IF EXISTS public.can_access_streamer_data(text) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_admin_type() CASCADE;
DROP FUNCTION IF EXISTS public.is_moderator(bigint, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_obs_token(text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_obs_token(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_tokens() CASCADE;
DROP FUNCTION IF EXISTS public.notify_telegram_new_donation() CASCADE;
DROP FUNCTION IF EXISTS public.validate_donation_input(text, text, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.sanitize_text_input(text) CASCADE;

-- Drop all streamer-related tables
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.custom_sound_alerts CASCADE;
DROP TABLE IF EXISTS public.donation_gifs CASCADE;
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.moderators CASCADE;
DROP TABLE IF EXISTS public.obs_access_tokens CASCADE;
DROP TABLE IF EXISTS public.streamer_contracts CASCADE;