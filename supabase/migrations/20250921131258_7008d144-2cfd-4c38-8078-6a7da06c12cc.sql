-- Drop the foreign key constraint completely so we can link streamers to our custom auth users
ALTER TABLE public.streamers DROP CONSTRAINT IF EXISTS streamers_user_id_fkey;

-- Update streamers table to link to the auth users
UPDATE public.streamers SET user_id = '11111111-1111-1111-1111-111111111111' WHERE streamer_slug = 'ankit';
UPDATE public.streamers SET user_id = '22222222-2222-2222-2222-222222222222' WHERE streamer_slug = 'techgamer';
UPDATE public.streamers SET user_id = '33333333-3333-3333-3333-333333333333' WHERE streamer_slug = 'musicstream';
UPDATE public.streamers SET user_id = '44444444-4444-4444-4444-444444444444' WHERE streamer_slug = 'fitnessflow';
UPDATE public.streamers SET user_id = '55555555-5555-5555-5555-555555555555' WHERE streamer_slug = 'chia_gaming';
UPDATE public.streamers SET user_id = '66666666-6666-6666-6666-666666666666' WHERE streamer_slug = 'demostreamer';
UPDATE public.streamers SET user_id = '77777777-7777-7777-7777-777777777777' WHERE streamer_slug = 'artcreate';
UPDATE public.streamers SET user_id = '88888888-8888-8888-8888-888888888888' WHERE streamer_slug = 'codelive';

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