-- Secure obs_access_tokens: remove public read access; keep existing owner-only read policy
-- 1) Ensure RLS is enabled
ALTER TABLE public.obs_access_tokens ENABLE ROW LEVEL SECURITY;

-- 2) Drop overly-permissive public SELECT policy (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'obs_access_tokens' 
      AND policyname = 'Allow token validation'
  ) THEN
    DROP POLICY "Allow token validation" ON public.obs_access_tokens;
  END IF;
END$$;

-- 3) Keep or (re)create a restrictive SELECT policy for owners (via admin_users mapping)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'obs_access_tokens' 
      AND policyname = 'Users can view their OBS tokens'
  ) THEN
    CREATE POLICY "Users can view their OBS tokens"
    ON public.obs_access_tokens
    FOR SELECT
    USING (
      admin_type IN (
        SELECT admin_users.admin_type
        FROM public.admin_users
        WHERE admin_users.user_email = auth.email()
      )
    );
  END IF;
END$$;

-- Note: We intentionally do not modify INSERT/UPDATE/DELETE policies in this change
-- to avoid breaking the current token generation flow that relies on client-side inserts/updates.
-- Overlays and audio players should use the existing SECURITY DEFINER RPC validate_obs_token()
-- for anonymous token validation.
