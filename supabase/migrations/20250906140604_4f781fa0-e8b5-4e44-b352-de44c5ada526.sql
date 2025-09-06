-- Create a function to link the logged-in user to a streamer by slug (no auth schema triggers)
-- This enables OAuth users to access their dashboards by securely claiming unassigned streamer records
CREATE OR REPLACE FUNCTION public.link_streamer_to_current_user(p_streamer_slug text)
RETURNS TABLE(linked boolean, streamer_id uuid) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s RECORD;
  current_user_id uuid;
BEGIN
  -- Ensure we have an authenticated user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid;
    RETURN;
  END IF;

  -- Try to find existing streamer by slug
  SELECT id, user_id INTO s FROM public.streamers WHERE streamer_slug = p_streamer_slug LIMIT 1;

  IF NOT FOUND THEN
    -- If streamer doesn't exist, create one for this user (keeps schema consistent)
    INSERT INTO public.streamers (
      user_id,
      streamer_slug,
      streamer_name,
      brand_color,
      hyperemotes_enabled,
      hyperemotes_min_amount
    ) VALUES (
      current_user_id,
      p_streamer_slug,
      initcap(replace(p_streamer_slug, '_', ' ')),
      '#6366f1',
      true,
      50
    ) RETURNING id INTO s.id;

    RETURN QUERY SELECT true, s.id;
    RETURN;
  END IF;

  -- If found and unclaimed, link to current user
  IF s.user_id IS NULL THEN
    UPDATE public.streamers SET user_id = current_user_id WHERE id = s.id;
    RETURN QUERY SELECT true, s.id;
    RETURN;
  END IF;

  -- If already linked to this user, success
  IF s.user_id = current_user_id THEN
    RETURN QUERY SELECT true, s.id;
    RETURN;
  END IF;

  -- If linked to another user, do not change
  RETURN QUERY SELECT false, s.id;
END;
$$;