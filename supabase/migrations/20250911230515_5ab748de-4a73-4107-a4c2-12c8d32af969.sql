-- Fix ankit streamer duplicates and login issue

-- First, delete the old ankit streamer that has the wrong user_id
DELETE FROM streamers 
WHERE id = '5e588938-c0c7-49b0-a69e-b393724fb8f3' 
AND streamer_slug = 'ankit' 
AND user_id = 'f0f13d9b-d446-4057-9e0f-511d8b1fafdb';

-- Update the correct ankit streamer's slug from a04293250_7c71f6fd to ankit
UPDATE streamers 
SET streamer_slug = 'ankit',
    streamer_name = 'Ankit',
    updated_at = now()
WHERE id = '5c4644df-57e8-4371-ac5b-c9555ef7e1d6'
AND user_id = '7c71f6fd-660a-4a0f-8675-498dc4f98786';

-- Update the streamers_auth_emails to point to the correct user_id
UPDATE streamers_auth_emails 
SET streamer_id = '7c71f6fd-660a-4a0f-8675-498dc4f98786'
WHERE email = 'a04293250@gmail.com'
AND streamer_id = 'f0f13d9b-d446-4057-9e0f-511d8b1fafdb';