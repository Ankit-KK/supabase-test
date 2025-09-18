-- Step 1: Drop ALL existing functions completely
DROP FUNCTION IF EXISTS public.get_streamer_by_slug(text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_obs_token(text) CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.generate_obs_token(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS public.validate_donation_input(numeric, text, text) CASCADE;