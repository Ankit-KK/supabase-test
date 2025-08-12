-- Secure streamer_contracts RLS: remove public read/update, keep admin and streamer-specific access
-- 1) Ensure RLS is enabled
ALTER TABLE public.streamer_contracts ENABLE ROW LEVEL SECURITY;

-- 2) Drop overly-permissive policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'streamer_contracts' AND policyname = 'Allow anyone to read streamer contracts'
  ) THEN
    DROP POLICY "Allow anyone to read streamer contracts" ON public.streamer_contracts;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'streamer_contracts' AND policyname = 'Allow anyone to update streamer contracts'
  ) THEN
    DROP POLICY "Allow anyone to update streamer contracts" ON public.streamer_contracts;
  END IF;
END$$;

-- 3) Reaffirm safe policies (already exist in schema, but create if missing to be idempotent)
DO $$
BEGIN
  -- Admin can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'streamer_contracts' AND policyname = 'Admin can view all contracts'
  ) THEN
    CREATE POLICY "Admin can view all contracts"
    ON public.streamer_contracts
    FOR SELECT
    USING (public.is_admin_user());
  END IF;

  -- Admin can update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'streamer_contracts' AND policyname = 'Admin can update contracts'
  ) THEN
    CREATE POLICY "Admin can update contracts"
    ON public.streamer_contracts
    FOR UPDATE
    USING (public.is_admin_user());
  END IF;

  -- Admin can insert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'streamer_contracts' AND policyname = 'Admin can insert contracts'
  ) THEN
    CREATE POLICY "Admin can insert contracts"
    ON public.streamer_contracts
    FOR INSERT
    WITH CHECK (public.is_admin_user());
  END IF;

  -- Streamers can view their contracts by streamer_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'streamer_contracts' AND policyname = 'Streamers can view their contracts'
  ) THEN
    CREATE POLICY "Streamers can view their contracts"
    ON public.streamer_contracts
    FOR SELECT
    USING (public.can_access_streamer_data(streamer_type));
  END IF;
END$$;

-- Note: We intentionally keep the existing public INSERT policy (if present)
-- to avoid breaking current unsigned signing flows. Once streamers use Supabase auth,
-- we can tighten INSERT to can_access_streamer_data(streamer_type).
