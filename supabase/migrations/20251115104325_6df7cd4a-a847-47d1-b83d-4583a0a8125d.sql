-- Insert auth credentials for Damask Plays
INSERT INTO auth_users (
  email, 
  password_hash, 
  role, 
  streamer_id, 
  username,
  is_active
)
VALUES (
  'damask@hyperchat.site',
  'damask123',
  'user',
  (SELECT id FROM streamers WHERE streamer_slug = 'damask_plays'),
  'damask_plays',
  true
)
ON CONFLICT (email) DO NOTHING;