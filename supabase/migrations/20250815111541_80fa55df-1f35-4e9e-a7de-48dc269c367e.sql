-- Add username and password columns to streamers table
ALTER TABLE streamers 
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN password TEXT;

-- Set default credentials for existing streamer
UPDATE streamers 
SET username = 'chia_gaming', password = 'password123' 
WHERE streamer_slug = 'chia_gaming';