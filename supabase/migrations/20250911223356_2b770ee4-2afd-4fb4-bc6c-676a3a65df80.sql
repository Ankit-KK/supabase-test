-- Add ankit.hyperchat@gmail.com to demostreamer authorized emails
INSERT INTO streamers_auth_emails (streamer_id, email)
SELECT s.id, 'ankit.hyperchat@gmail.com'
FROM streamers s 
WHERE s.streamer_slug = 'demostreamer'
AND NOT EXISTS (
  SELECT 1 FROM streamers_auth_emails sae 
  WHERE sae.streamer_id = s.id 
  AND sae.email = 'ankit.hyperchat@gmail.com'
);