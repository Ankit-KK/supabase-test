-- Insert test users for demonstration
INSERT INTO public.auth_users (email, password_hash, username, role, is_active)
VALUES 
  ('admin@example.com', public.hash_password('admin123'), 'admin', 'admin', true),
  ('test@example.com', public.hash_password('password123'), 'testuser', 'user', true),
  ('ankit@example.com', public.hash_password('ankit123'), 'ankit', 'streamer', true);

-- Link ankit user to the ankit streamer
UPDATE public.auth_users 
SET streamer_id = (SELECT id FROM public.streamers WHERE streamer_slug = 'ankit' LIMIT 1)
WHERE email = 'ankit@example.com';