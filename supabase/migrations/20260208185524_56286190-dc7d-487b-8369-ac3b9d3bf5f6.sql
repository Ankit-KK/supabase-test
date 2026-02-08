
-- 1. Deny all anonymous access
CREATE POLICY "Deny anonymous access to password_reset_tokens"
  ON public.password_reset_tokens
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- 2. Deny all authenticated user access
CREATE POLICY "Deny authenticated access to password_reset_tokens"
  ON public.password_reset_tokens
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- 3. Allow service role full access (used by edge functions)
CREATE POLICY "Service role can manage password_reset_tokens"
  ON public.password_reset_tokens
  AS RESTRICTIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
