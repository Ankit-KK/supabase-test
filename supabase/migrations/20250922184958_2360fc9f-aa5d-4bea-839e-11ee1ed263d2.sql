-- Fix user_id mappings in streamers table to match auth_users
-- Update ankit streamer to use correct user_id from auth_users
UPDATE streamers 
SET user_id = (SELECT id FROM auth_users WHERE email = 'ankit@example.com')
WHERE streamer_slug = 'ankit';

-- Create missing streamers for artcreate and codelive
INSERT INTO streamers (user_id, streamer_slug, streamer_name, brand_color, hyperemotes_enabled, hyperemotes_min_amount)
SELECT 
  au.id,
  'artcreate',
  'ArtCreate', 
  '#ec4899',
  true,
  50
FROM auth_users au 
WHERE au.email = 'artcreate@example.com'
AND NOT EXISTS (SELECT 1 FROM streamers WHERE streamer_slug = 'artcreate');

INSERT INTO streamers (user_id, streamer_slug, streamer_name, brand_color, hyperemotes_enabled, hyperemotes_min_amount)
SELECT 
  au.id,
  'codelive',
  'CodeLive',
  '#ef4444', 
  true,
  50
FROM auth_users au 
WHERE au.email = 'codelive@example.com'
AND NOT EXISTS (SELECT 1 FROM streamers WHERE streamer_slug = 'codelive');