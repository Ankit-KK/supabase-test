-- First, let's insert the auth users without worrying about constraints
INSERT INTO public.auth_users (id, email, password_hash, username, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ankit@example.com', 'temp123', 'ankit', 'user'),
  ('22222222-2222-2222-2222-222222222222', 'techgamer@example.com', 'temp123', 'techgamer', 'user'),
  ('33333333-3333-3333-3333-333333333333', 'musicstream@example.com', 'temp123', 'musicstream', 'user'),
  ('44444444-4444-4444-4444-444444444444', 'fitnessflow@example.com', 'temp123', 'fitnessflow', 'user'),
  ('55555555-5555-5555-5555-555555555555', 'chia@example.com', 'temp123', 'chia_gaming', 'user'),
  ('66666666-6666-6666-6666-666666666666', 'demostreamer@example.com', 'temp123', 'demostreamer', 'user'),
  ('77777777-7777-7777-7777-777777777777', 'artcreate@example.com', 'temp123', 'artcreate', 'user'),
  ('88888888-8888-8888-8888-888888888888', 'codelive@example.com', 'temp123', 'codelive', 'user')
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  username = EXCLUDED.username;