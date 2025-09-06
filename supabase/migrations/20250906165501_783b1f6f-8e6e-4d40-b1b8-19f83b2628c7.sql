-- Drop legacy password-based columns and add login tracking to streamers
ALTER TABLE public.streamers
  DROP COLUMN IF EXISTS username,
  DROP COLUMN IF EXISTS password,
  ADD COLUMN IF NOT EXISTS last_login_provider text,
  ADD COLUMN IF NOT EXISTS last_login_email text,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- Create table to manage allowed Gmail addresses per streamer
CREATE TABLE IF NOT EXISTS public.streamers_auth_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id uuid NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(streamer_id, email)
);

ALTER TABLE public.streamers_auth_emails ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (ignore errors)
DROP POLICY IF EXISTS "Owners manage their auth emails" ON public.streamers_auth_emails;
DROP POLICY IF EXISTS "Admins manage all auth emails" ON public.streamers_auth_emails;

-- Policies: streamer owners can manage; admins can manage all
CREATE POLICY "Owners manage their auth emails"
ON public.streamers_auth_emails
FOR ALL
USING (
  streamer_id IN (
    SELECT s.id FROM public.streamers s WHERE s.user_id = auth.uid()
  )
)
WITH CHECK (
  streamer_id IN (
    SELECT s.id FROM public.streamers s WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "Admins manage all auth emails"
ON public.streamers_auth_emails
FOR ALL
USING (public.is_admin_email(auth.email()))
WITH CHECK (public.is_admin_email(auth.email()));

-- Function to check if a given email is allowed for a streamer slug
CREATE OR REPLACE FUNCTION public.check_streamer_email_allowed(p_streamer_slug text, p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s_id uuid;
  has_specific boolean;
BEGIN
  -- Admin emails are always allowed
  IF public.is_admin_email(p_email) THEN
    RETURN true;
  END IF;

  SELECT id INTO s_id FROM public.streamers WHERE streamer_slug = p_streamer_slug LIMIT 1;
  IF s_id IS NULL THEN
    RETURN false;
  END IF;

  -- If there are specific allowed emails configured, enforce membership
  SELECT EXISTS (
    SELECT 1 FROM public.streamers_auth_emails WHERE streamer_id = s_id
  ) INTO has_specific;

  IF has_specific THEN
    RETURN EXISTS (
      SELECT 1 FROM public.streamers_auth_emails 
      WHERE streamer_id = s_id AND lower(email) = lower(p_email)
    );
  END IF;

  -- Default allow (backward compatible) when no specific emails configured
  RETURN true;
END;$$;

-- Function to record login metadata for a streamer
CREATE OR REPLACE FUNCTION public.record_streamer_login(p_streamer_slug text, p_email text, p_provider text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.streamers
  SET last_login_provider = p_provider,
      last_login_email = p_email,
      last_login_at = now(),
      updated_at = now()
  WHERE streamer_slug = p_streamer_slug;
END;$$;