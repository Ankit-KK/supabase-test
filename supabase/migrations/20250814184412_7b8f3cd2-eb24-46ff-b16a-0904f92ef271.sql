-- Drop all streamer-related functions first (to avoid dependency issues)
DROP FUNCTION IF EXISTS public.can_access_streamer_data(text);
DROP FUNCTION IF EXISTS public.is_admin_user();
DROP FUNCTION IF EXISTS public.get_user_admin_type();
DROP FUNCTION IF EXISTS public.is_moderator(bigint, text);
DROP FUNCTION IF EXISTS public.create_obs_token(text);
DROP FUNCTION IF EXISTS public.validate_obs_token(text, text);
DROP FUNCTION IF EXISTS public.cleanup_expired_tokens();
DROP FUNCTION IF EXISTS public.notify_telegram_new_donation();
DROP FUNCTION IF EXISTS public.validate_donation_input(text, text, numeric);
DROP FUNCTION IF EXISTS public.sanitize_text_input(text);

-- Drop all streamer-related tables
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.custom_sound_alerts CASCADE;
DROP TABLE IF EXISTS public.donation_gifs CASCADE;
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.moderators CASCADE;
DROP TABLE IF EXISTS public.obs_access_tokens CASCADE;
DROP TABLE IF EXISTS public.streamer_contracts CASCADE;

-- Clean up any remaining policies or triggers that might reference dropped objects
-- (CASCADE should handle most of this, but let's be thorough)

-- Note: Core tables preserved:
-- - profiles (user profiles)
-- - page_visits (analytics)
-- - reviews (testimonials)
-- - user_signups (contact forms)
-- - audit_logs (security logs)
-- - rate_limits (security)
-- - predefined_queries (admin queries)
-- - user_queries (user queries)
-- - visits (basic analytics)