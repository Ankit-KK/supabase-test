-- Remove the foreign key constraint from profiles table to auth.users
DO $$ 
BEGIN
    -- Remove foreign key constraint from profiles if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
END $$;

-- Insert auth users for each streamer with temporary passwords
INSERT INTO public.auth_users (id, email, password_hash, username, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ankit@example.com', 'temp123', 'ankit', 'user'),
  ('22222222-2222-2222-2222-222222222222', 'techgamer@example.com', 'temp123', 'techgamer', 'user'),
  ('33333333-3333-3333-3333-333333333333', 'musicstream@example.com', 'temp123', 'musicstream', 'user'),
  ('44444444-4444-4444-4444-444444444444', 'fitnessflow@example.com', 'temp123', 'fitnessflow', 'user'),
  ('55555555-5555-5555-5555-555555555555', 'chia@example.com', 'temp123', 'chia_gaming', 'user'),
  ('66666666-6666-6666-6666-666666666666', 'demostreamer@example.com', 'temp123', 'demostreamer', 'user'),
  ('77777777-7777-7777-7777-777777777777', 'artcreate@example.com', 'temp123', 'artcreate', 'user'),
  ('88888888-8888-8888-8888-888888888888', 'codelive@example.com', 'temp123', 'codelive', 'user')
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  username = EXCLUDED.username;

-- Create profiles for these users
INSERT INTO public.profiles (id, display_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Ankit'),
  ('22222222-2222-2222-2222-222222222222', 'Tech Gamer'),
  ('33333333-3333-3333-3333-333333333333', 'Music Stream'),
  ('44444444-4444-4444-4444-444444444444', 'Fitness Flow'),
  ('55555555-5555-5555-5555-555555555555', 'Chia Gaming'),
  ('66666666-6666-6666-6666-666666666666', 'Demo Streamer'),
  ('77777777-7777-7777-7777-777777777777', 'Art Create'),
  ('88888888-8888-8888-8888-888888888888', 'Code Live')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name;

-- Update streamers table to link to the auth users
UPDATE public.streamers SET user_id = '11111111-1111-1111-1111-111111111111' WHERE streamer_slug = 'ankit';
UPDATE public.streamers SET user_id = '22222222-2222-2222-2222-222222222222' WHERE streamer_slug = 'techgamer';
UPDATE public.streamers SET user_id = '33333333-3333-3333-3333-333333333333' WHERE streamer_slug = 'musicstream';
UPDATE public.streamers SET user_id = '44444444-4444-4444-4444-444444444444' WHERE streamer_slug = 'fitnessflow';
UPDATE public.streamers SET user_id = '55555555-5555-5555-5555-555555555555' WHERE streamer_slug = 'chia_gaming';
UPDATE public.streamers SET user_id = '66666666-6666-6666-6666-666666666666' WHERE streamer_slug = 'demostreamer';
UPDATE public.streamers SET user_id = '77777777-7777-7777-7777-777777777777' WHERE streamer_slug = 'artcreate';
UPDATE public.streamers SET user_id = '88888888-8888-8888-8888-888888888888' WHERE streamer_slug = 'codelive';