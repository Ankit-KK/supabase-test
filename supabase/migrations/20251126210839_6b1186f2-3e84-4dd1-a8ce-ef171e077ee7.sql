-- Create auth user for BongFlick dashboard access
INSERT INTO public.auth_users (email, password_hash, role, is_active)
VALUES ('bongflick@hyperchat.site', 'bongflick123', 'streamer', true);

-- Link the auth user to the bongflick streamer
UPDATE public.streamers
SET user_id = (SELECT id FROM public.auth_users WHERE email = 'bongflick@hyperchat.site')
WHERE streamer_slug = 'bongflick';