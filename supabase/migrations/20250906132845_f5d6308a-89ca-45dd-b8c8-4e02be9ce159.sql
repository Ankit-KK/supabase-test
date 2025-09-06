-- SECURITY FIX: Remove Public Access to Moderator Contact Information

-- Remove the dangerous policies that expose moderator information publicly
DROP POLICY IF EXISTS "Allow moderator management for custom auth system" ON public.streamers_moderators;
DROP POLICY IF EXISTS "System can access moderator data for operations" ON public.streamers_moderators;

-- Verify the secure policy exists, if not create it
DO $$
BEGIN
  -- Check if the secure policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'streamers_moderators' 
    AND policyname = 'Streamers can manage their own moderators'
  ) THEN
    -- Create the secure policy
    EXECUTE 'CREATE POLICY "Streamers can manage their own moderators"
    ON public.streamers_moderators
    FOR ALL
    USING (
      streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
    )
    WITH CHECK (
      streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
    )';
  END IF;
END $$;

-- Add security logging for moderator access attempts
CREATE OR REPLACE FUNCTION public.log_moderator_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all access attempts to moderator data
  PERFORM public.log_sensitive_access(
    'streamers_moderators',
    TG_OP,
    COALESCE(NEW.id, OLD.id)
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for moderator access logging
DROP TRIGGER IF EXISTS moderator_access_audit ON public.streamers_moderators;
CREATE TRIGGER moderator_access_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.streamers_moderators
  FOR EACH ROW EXECUTE FUNCTION public.log_moderator_access();

-- Add a secure function for moderators to verify themselves without exposing others
CREATE OR REPLACE FUNCTION public.verify_moderator_access(
  p_streamer_slug text,
  p_telegram_user_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streamer_record RECORD;
BEGIN
  -- Get streamer by slug
  SELECT id INTO streamer_record
  FROM public.streamers
  WHERE streamer_slug = p_streamer_slug;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if the telegram user is an active moderator
  RETURN EXISTS (
    SELECT 1 FROM public.streamers_moderators
    WHERE streamer_id = streamer_record.id
    AND telegram_user_id = p_telegram_user_id
    AND is_active = true
  );
END;
$$;