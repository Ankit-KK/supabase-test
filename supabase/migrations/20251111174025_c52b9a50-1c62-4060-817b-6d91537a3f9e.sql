-- Insert user credentials for Looteriya Gaming dashboard
INSERT INTO public.auth_users (email, password_hash, username, role, is_active)
VALUES ('looteriya@hyperchat.site', 'Streamer123!', 'Looteriya Gaming', 'user', true)
ON CONFLICT (email) DO NOTHING;