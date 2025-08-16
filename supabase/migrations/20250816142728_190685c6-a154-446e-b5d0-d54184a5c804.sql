-- Ensure RLS is enabled and correct policies exist for obs_tokens to fix 403 on inserts

-- Enable RLS (safe if already enabled)
ALTER TABLE public.obs_tokens ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert tokens for streamers they own or for unassigned streamers
DROP POLICY IF EXISTS "obs_tokens_insert_owned_or_unassigned" ON public.obs_tokens;
CREATE POLICY "obs_tokens_insert_owned_or_unassigned"
ON public.obs_tokens
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.streamers s
    WHERE s.id = obs_tokens.streamer_id
      AND (s.user_id = auth.uid() OR s.user_id IS NULL)
  )
);

-- Allow authenticated users to update tokens for streamers they own or for unassigned streamers
DROP POLICY IF EXISTS "obs_tokens_update_owned_or_unassigned" ON public.obs_tokens;
CREATE POLICY "obs_tokens_update_owned_or_unassigned"
ON public.obs_tokens
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.streamers s
    WHERE s.id = obs_tokens.streamer_id
      AND (s.user_id = auth.uid() OR s.user_id IS NULL)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.streamers s
    WHERE s.id = obs_tokens.streamer_id
      AND (s.user_id = auth.uid() OR s.user_id IS NULL)
  )
);

-- Allow authenticated users to read tokens for streamers they own or unassigned (settings UI)
DROP POLICY IF EXISTS "obs_tokens_select_owned_or_unassigned" ON public.obs_tokens;
CREATE POLICY "obs_tokens_select_owned_or_unassigned"
ON public.obs_tokens
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.streamers s
    WHERE s.id = obs_tokens.streamer_id
      AND (s.user_id = auth.uid() OR s.user_id IS NULL)
  )
);
