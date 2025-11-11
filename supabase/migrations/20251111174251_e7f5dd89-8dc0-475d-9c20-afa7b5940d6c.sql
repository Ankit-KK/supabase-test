-- Link the looteriya@hyperchat.site user to looteriya_gaming streamer
UPDATE public.auth_users
SET streamer_id = (
  SELECT id FROM public.streamers 
  WHERE streamer_slug = 'looteriya_gaming'
)
WHERE email = 'looteriya@hyperchat.site';