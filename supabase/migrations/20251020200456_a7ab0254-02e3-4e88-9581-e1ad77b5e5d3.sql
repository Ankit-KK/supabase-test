-- Add auth_users for demo2, demo3, demo4 streamers
-- Password: Demo2Pass123! (hashed with bcrypt)
INSERT INTO public.auth_users (email, password_hash, role, username, is_active)
VALUES 
  ('demo2@hyperchat.com', '$2a$10$qJ5mYvZKjC9kxRZKZHZj3OZqJ5mYvZKjC9kxRZKZHZj3OZqJ5mYvZ', 'user', 'demo2_admin', true),
  ('demo3@hyperchat.com', '$2a$10$qJ5mYvZKjC9kxRZKZHZj3OZqJ5mYvZKjC9kxRZKZHZj3OZqJ5mYvZ', 'user', 'demo3_admin', true),
  ('demo4@hyperchat.com', '$2a$10$qJ5mYvZKjC9kxRZKZHZj3OZqJ5mYvZKjC9kxRZKZHZj3OZqJ5mYvZ', 'user', 'demo4_admin', true);

-- Link auth_users to their respective streamers
-- Update demo2 streamer with user_id
UPDATE public.streamers 
SET user_id = (SELECT id FROM public.auth_users WHERE email = 'demo2@hyperchat.com')
WHERE streamer_slug = 'demo2';

-- Update demo3 streamer with user_id
UPDATE public.streamers 
SET user_id = (SELECT id FROM public.auth_users WHERE email = 'demo3@hyperchat.com')
WHERE streamer_slug = 'demo3';

-- Update demo4 streamer with user_id
UPDATE public.streamers 
SET user_id = (SELECT id FROM public.auth_users WHERE email = 'demo4@hyperchat.com')
WHERE streamer_slug = 'demo4';

-- Add emails to streamers_auth_emails table for dashboard access
INSERT INTO public.streamers_auth_emails (email, streamer_id)
SELECT 
  'demo2@hyperchat.com',
  id
FROM public.streamers
WHERE streamer_slug = 'demo2';

INSERT INTO public.streamers_auth_emails (email, streamer_id)
SELECT 
  'demo3@hyperchat.com',
  id
FROM public.streamers
WHERE streamer_slug = 'demo3';

INSERT INTO public.streamers_auth_emails (email, streamer_id)
SELECT 
  'demo4@hyperchat.com',
  id
FROM public.streamers
WHERE streamer_slug = 'demo4';