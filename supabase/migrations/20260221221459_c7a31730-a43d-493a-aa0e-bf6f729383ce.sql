
-- Fix dorp_plays_donations_public view (missing security_invoker)
ALTER VIEW public.dorp_plays_donations_public SET (security_invoker = on);

-- Fix looteriya_gaming_donations
DROP POLICY IF EXISTS "Service role can manage all donations" ON public.looteriya_gaming_donations;
CREATE POLICY "Service role can manage all donations"
  ON public.looteriya_gaming_donations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix mr_champion_donations
DROP POLICY IF EXISTS "Service role can manage mr_champion donations" ON public.mr_champion_donations;
CREATE POLICY "Service role can manage mr_champion donations"
  ON public.mr_champion_donations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix w_era_donations
DROP POLICY IF EXISTS "Service role can manage w_era donations" ON public.w_era_donations;
CREATE POLICY "Service role can manage w_era donations"
  ON public.w_era_donations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix banned_donors
DROP POLICY IF EXISTS "Service role can manage banned donors" ON public.banned_donors;
CREATE POLICY "Service role can manage banned donors"
  ON public.banned_donors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix discord_callback_mapping
DROP POLICY IF EXISTS "Service role can manage discord callbacks" ON public.discord_callback_mapping;
CREATE POLICY "Service role can manage discord callbacks"
  ON public.discord_callback_mapping FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix moderation_actions
DROP POLICY IF EXISTS "Service role can manage moderation actions" ON public.moderation_actions;
CREATE POLICY "Service role can manage moderation actions"
  ON public.moderation_actions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix obs_tokens
DROP POLICY IF EXISTS "Service role can access tokens" ON public.obs_tokens;
CREATE POLICY "Service role can manage obs tokens"
  ON public.obs_tokens FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix telegram_callback_mapping bad policy
DROP POLICY IF EXISTS "Service role can manage telegram callbacks" ON public.telegram_callback_mapping;
