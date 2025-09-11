-- Clean up and properly associate emails with correct streamers

-- First, remove any incorrect associations if they exist
DELETE FROM streamers_auth_emails 
WHERE email IN ('a04293250@gmail.com', 'a37181881@gmail.com')
AND streamer_id NOT IN (
  SELECT s.id FROM streamers s 
  WHERE (s.streamer_slug = 'ankit' AND email = 'a04293250@gmail.com')
  OR (s.streamer_slug = 'chia_gaming' AND email = 'a37181881@gmail.com')
);

-- Add a04293250@gmail.com to ankit streamer
INSERT INTO streamers_auth_emails (streamer_id, email)
SELECT s.id, 'a04293250@gmail.com'
FROM streamers s 
WHERE s.streamer_slug = 'ankit'
AND NOT EXISTS (
  SELECT 1 FROM streamers_auth_emails sae 
  WHERE sae.streamer_id = s.id 
  AND sae.email = 'a04293250@gmail.com'
);

-- Add a37181881@gmail.com to chia_gaming streamer
INSERT INTO streamers_auth_emails (streamer_id, email)
SELECT s.id, 'a37181881@gmail.com'
FROM streamers s 
WHERE s.streamer_slug = 'chia_gaming'
AND NOT EXISTS (
  SELECT 1 FROM streamers_auth_emails sae 
  WHERE sae.streamer_id = s.id 
  AND sae.email = 'a37181881@gmail.com'
);