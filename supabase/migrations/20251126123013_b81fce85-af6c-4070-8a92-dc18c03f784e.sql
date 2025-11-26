-- Insert new auth user for VIP BHAI
INSERT INTO public.auth_users (email, password_hash, username, role, is_active)
VALUES ('vipbhai@hyperchat.site', 'vipbhai123', 'vipbhai', 'user', true);

-- Link the VIP BHAI streamer to the auth user
UPDATE public.streamers 
SET user_id = (SELECT id FROM public.auth_users WHERE email = 'vipbhai@hyperchat.site')
WHERE streamer_slug = 'vipbhai';