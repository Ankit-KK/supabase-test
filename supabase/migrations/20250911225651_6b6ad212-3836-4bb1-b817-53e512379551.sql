-- Fix incorrect streamer_id associations - use user_id instead of id
-- First, clear the incorrect entries I just added
DELETE FROM streamers_auth_emails 
WHERE email IN ('a04293250@gmail.com', 'a37181881@gmail.com');

-- Add a04293250@gmail.com to ankit streamer using user_id
INSERT INTO streamers_auth_emails (streamer_id, email)
SELECT s.user_id, 'a04293250@gmail.com'
FROM streamers s 
WHERE s.streamer_slug = 'ankit'
AND s.user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM streamers_auth_emails sae 
  WHERE sae.streamer_id = s.user_id 
  AND sae.email = 'a04293250@gmail.com'
);

-- Add a37181881@gmail.com to chia_gaming streamer using user_id
INSERT INTO streamers_auth_emails (streamer_id, email)
SELECT s.user_id, 'a37181881@gmail.com'
FROM streamers s 
WHERE s.streamer_slug = 'chia_gaming'
AND s.user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM streamers_auth_emails sae 
  WHERE sae.streamer_id = s.user_id 
  AND sae.email = 'a37181881@gmail.com'
);