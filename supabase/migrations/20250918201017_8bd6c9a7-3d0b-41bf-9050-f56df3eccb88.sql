-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the hash_password function to use the extension properly
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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