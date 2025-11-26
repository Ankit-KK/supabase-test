-- Create auth user for SAGAR UJJWAL GAMING and link to streamer
WITH new_user AS (
  INSERT INTO auth_users (email, password_hash, username, role, is_active)
  VALUES ('sagarujjwalgaming@hyperchat.site', 'sagarujjwalgaming123', 'sagarujjwalgaming', 'user', true)
  RETURNING id
)
UPDATE streamers 
SET user_id = (SELECT id FROM new_user)
WHERE streamer_slug = 'sagarujjwalgaming';