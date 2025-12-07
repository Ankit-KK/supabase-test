-- Insert auth user for ClumsyGod
INSERT INTO public.auth_users (email, password_hash, role, is_active)
VALUES ('clumsygod@hyperchat.site', 'clumsygod123', 'user', true);

-- Link the auth user to the clumsygod streamer
UPDATE public.streamers 
SET user_id = (SELECT id FROM public.auth_users WHERE email = 'clumsygod@hyperchat.site')
WHERE streamer_slug = 'clumsygod';