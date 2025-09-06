-- Update the streamer creation function to handle specific streamers
-- This allows Google OAuth users to access their proper streamer dashboards

CREATE OR REPLACE FUNCTION public.create_streamer_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  display_name text;
  streamer_slug text;
  streamer_name text;
BEGIN
  -- Get user email and display name
  user_email := NEW.email;
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Determine streamer based on email domain or specific emails
  -- This is just an example - you may want to customize this logic
  IF user_email ILIKE '%ankit%' OR user_email = 'ankit@example.com' THEN
    streamer_slug := 'ankit';
    streamer_name := 'Ankit';
  ELSIF user_email ILIKE '%chia%' OR user_email ILIKE '%gaming%' OR user_email = 'chia@example.com' THEN
    streamer_slug := 'chia_gaming';
    streamer_name := 'Chia Gaming';
  ELSE
    -- Default streamer creation with unique slug
    streamer_slug := lower(split_part(NEW.email, '@', 1)) || '_' || substr(NEW.id::text, 1, 8);
    streamer_name := display_name;
  END IF;
  
  -- Check if streamer with this slug already exists
  IF NOT EXISTS (SELECT 1 FROM public.streamers WHERE streamer_slug = streamer_slug) THEN
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
      streamer_slug,
      streamer_name,
      CASE 
        WHEN streamer_slug = 'ankit' THEN '#3b82f6'
        WHEN streamer_slug = 'chia_gaming' THEN '#ec4899'
        ELSE '#6366f1'
      END,
      true,
      50
    );
  ELSE
    -- If streamer exists but doesn't have a user_id, link it to this user
    UPDATE public.streamers 
    SET user_id = NEW.id
    WHERE streamer_slug = streamer_slug AND user_id IS NULL;
  END IF;
  
  -- Update profiles table with display name
  UPDATE public.profiles 
  SET display_name = display_name 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;