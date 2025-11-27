-- Create auth user for Jhanvoo
INSERT INTO public.auth_users (email, password_hash, username, is_active, role)
VALUES (
  'jhanvoo@hyperchat.site',
  'jhanvoo123', -- Plain password for demo (should be hashed in production)
  'jhanvoo',
  true,
  'streamer'
);

-- Link the auth user to the Jhanvoo streamer record
UPDATE public.streamers
SET user_id = (
  SELECT id FROM public.auth_users WHERE email = 'jhanvoo@hyperchat.site'
)
WHERE streamer_slug = 'jhanvoo';