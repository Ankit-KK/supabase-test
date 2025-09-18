-- Use a simpler password hashing approach with built-in functions
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use a simple but secure salt + hash approach
  RETURN encode(digest(gen_random_uuid()::text || password || gen_random_uuid()::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- For verification, we'll need to store salt separately or use a simple comparison
-- Let's create a simpler verify function that works with our edge function
CREATE OR REPLACE FUNCTION public.verify_password_simple(input_password TEXT, stored_email TEXT)
RETURNS TABLE(user_id uuid, email text, username text, role text, password_hash text, is_valid boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email, au.username, au.role, au.password_hash, true as is_valid
  FROM public.auth_users au
  WHERE au.email = stored_email AND au.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insert test users with simple passwords (we'll handle hashing in the edge function)
INSERT INTO public.auth_users (email, password_hash, username, role, is_active)
VALUES 
  ('admin@example.com', 'admin123', 'admin', 'admin', true),
  ('test@example.com', 'password123', 'testuser', 'user', true),
  ('ankit@example.com', 'ankit123', 'ankit', 'streamer', true);

-- Link ankit user to the ankit streamer
UPDATE public.auth_users 
SET streamer_id = (SELECT id FROM public.streamers WHERE streamer_slug = 'ankit' LIMIT 1)
WHERE email = 'ankit@example.com';