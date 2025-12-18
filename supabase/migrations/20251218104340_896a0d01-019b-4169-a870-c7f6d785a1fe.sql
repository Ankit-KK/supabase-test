-- Link the existing auth user to the jimmy_gaming streamer record
UPDATE public.streamers 
SET user_id = (SELECT id FROM public.auth_users WHERE email = 'jimmygaming@hyperchat.site')
WHERE streamer_slug = 'jimmy_gaming';