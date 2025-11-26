-- Create auth user for Mr Iqmaster
INSERT INTO public.auth_users (email, password_hash, role, username)
VALUES (
  'mriqmaster@hyperchat.site',
  crypt('mriqmaster123', gen_salt('bf')),
  'streamer',
  'mriqmaster'
)
ON CONFLICT (email) DO NOTHING;

-- Link user to streamer
UPDATE public.streamers
SET user_id = (SELECT id FROM public.auth_users WHERE email = 'mriqmaster@hyperchat.site')
WHERE streamer_slug = 'mriqmaster' AND user_id IS NULL;