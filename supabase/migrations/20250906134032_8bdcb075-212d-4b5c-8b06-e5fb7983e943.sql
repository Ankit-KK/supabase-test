-- Create profiles table and link streamers to authenticated users
-- This enables Google OAuth users to access their donation dashboards

-- Update profiles table to have proper structure for streamers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create a function to create initial streamer records for new authenticated users
CREATE OR REPLACE FUNCTION public.create_streamer_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_streamer_slug text;
  display_name text;
BEGIN
  -- Get display name from user metadata or email
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Create a unique slug from email username
  new_streamer_slug := lower(split_part(NEW.email, '@', 1)) || '_' || substr(NEW.id::text, 1, 8);
  
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
    new_streamer_slug,
    display_name,
    '#6366f1',
    true,
    50
  );
  
  -- Update profiles table with display name
  UPDATE public.profiles 
  SET display_name = display_name 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create streamer record for new users
DROP TRIGGER IF EXISTS create_streamer_on_signup ON auth.users;
CREATE TRIGGER create_streamer_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_streamer_for_user();