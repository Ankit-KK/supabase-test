-- Fix ambiguous references causing login callback failure
CREATE OR REPLACE FUNCTION public.create_streamer_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_email text;
  v_display_name text;
  v_streamer_slug text;
  v_streamer_name text;
  v_existing_id uuid;
BEGIN
  -- Get user email and display name
  v_user_email := NEW.email;
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Determine streamer based on email domain or specific emails
  IF v_user_email ILIKE '%ankit%' OR v_user_email = 'ankit@example.com' THEN
    v_streamer_slug := 'ankit';
    v_streamer_name := 'Ankit';
  ELSIF v_user_email ILIKE '%chia%' OR v_user_email ILIKE '%gaming%' OR v_user_email = 'chia@example.com' THEN
    v_streamer_slug := 'chia_gaming';
    v_streamer_name := 'Chia Gaming';
  ELSE
    -- Default streamer creation with unique slug
    v_streamer_slug := lower(split_part(NEW.email, '@', 1)) || '_' || substr(NEW.id::text, 1, 8);
    v_streamer_name := v_display_name;
  END IF;
  
  -- Check if streamer with this slug already exists
  SELECT s.id INTO v_existing_id
  FROM public.streamers s
  WHERE s.streamer_slug = v_streamer_slug
  LIMIT 1;
  
  IF v_existing_id IS NULL THEN
    -- Insert streamer record linked to the authenticated user
    INSERT INTO public.streamers (
      user_id,
      streamer_slug,
      streamer_name,
      brand_color,
      hyperemotes_enabled,
      hyperemotes_min_amount
    ) VALUES (
      NEW.id,
      v_streamer_slug,
      v_streamer_name,
      CASE 
        WHEN v_streamer_slug = 'ankit' THEN '#3b82f6'
        WHEN v_streamer_slug = 'chia_gaming' THEN '#ec4899'
        ELSE '#6366f1'
      END,
      true,
      50
    );
  ELSE
    -- If streamer exists but doesn't have a user_id, link it to this user
    UPDATE public.streamers s
    SET user_id = NEW.id
    WHERE s.id = v_existing_id AND s.user_id IS NULL;
  END IF;
  
  -- Update profiles table with display name
  UPDATE public.profiles p
  SET display_name = v_display_name 
  WHERE p.id = NEW.id;
  
  RETURN NEW;
END;
$function$;