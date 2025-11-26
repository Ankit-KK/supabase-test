-- Create auth user for Mr Iqmaster streamer
INSERT INTO auth_users (email, password_hash, role, is_active)
VALUES ('mriqmaster@hyperchat.site', 'mriqmaster123', 'streamer', true)
ON CONFLICT (email) DO NOTHING;

-- Link the user to the mriqmaster streamer
UPDATE streamers
SET user_id = (SELECT id FROM auth_users WHERE email = 'mriqmaster@hyperchat.site')
WHERE streamer_slug = 'mriqmaster';