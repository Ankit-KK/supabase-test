-- Link the looteriya_gaming streamer to the looteriya@hyperchat.site user
UPDATE public.streamers
SET user_id = (
  SELECT id FROM public.auth_users 
  WHERE email = 'looteriya@hyperchat.site'
)
WHERE streamer_slug = 'looteriya_gaming';