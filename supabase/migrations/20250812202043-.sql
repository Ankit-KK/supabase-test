-- Restrict public visibility of moderators table
-- 1) Ensure RLS is enabled
ALTER TABLE public.moderators ENABLE ROW LEVEL SECURITY;

-- 2) Drop public read policy that exposes Telegram IDs/usernames
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'moderators' 
      AND policyname = 'Public can read active moderators for validation'
  ) THEN
    DROP POLICY "Public can read active moderators for validation" ON public.moderators;
  END IF;
END$$;

-- 3) Ensure admins retain read access (explicit, though an existing ALL policy may already cover it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'moderators' 
      AND policyname = 'Admins can view moderators'
  ) THEN
    CREATE POLICY "Admins can view moderators"
    ON public.moderators
    FOR SELECT
    USING (is_admin_user());
  END IF;
END$$;

-- Note: Validation of moderator status for Telegram bot should use the SECURITY DEFINER function
-- public.is_moderator(p_telegram_id bigint, p_streamer_id text), which bypasses RLS safely, so
-- removing public SELECT will not break existing bot/overlay flows.
