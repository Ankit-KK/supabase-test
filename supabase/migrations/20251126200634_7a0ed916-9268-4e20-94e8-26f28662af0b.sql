-- Insert auth user for not your Kween
INSERT INTO auth_users (email, password_hash, username, role, is_active)
VALUES ('notyourkween@hyperchat.site', 'notyourkween123', 'notyourkween', 'user', true);

-- Link the auth user to the streamer
UPDATE streamers 
SET user_id = (SELECT id FROM auth_users WHERE email = 'notyourkween@hyperchat.site')
WHERE streamer_slug = 'notyourkween';