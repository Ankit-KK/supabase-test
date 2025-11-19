-- Insert new auth user for ThunderX
INSERT INTO auth_users (email, username, password_hash, role)
VALUES ('thunderx@hyperchat.site', 'thunderx', 'thunderx123', 'user');

-- Update streamers table to link the user
UPDATE streamers
SET user_id = (SELECT id FROM auth_users WHERE email = 'thunderx@hyperchat.site')
WHERE streamer_slug = 'thunderx';