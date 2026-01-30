-- Step 1: Create auth user for Wolfy
INSERT INTO auth_users (
  id,
  email,
  password_hash,
  username,
  role,
  is_active,
  failed_login_attempts
) VALUES (
  gen_random_uuid(),
  'wolfy@hyperchat.site',
  'Wolfy@2026',
  'wolfy',
  'user',
  true,
  0
);

-- Step 2: Link Wolfy streamer to the new auth user
UPDATE streamers 
SET user_id = (SELECT id FROM auth_users WHERE email = 'wolfy@hyperchat.site')
WHERE streamer_slug = 'wolfy';