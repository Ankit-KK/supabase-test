-- Update Ankit's hyperemote threshold to 50 rupees
UPDATE streamers 
SET hyperemotes_min_amount = 50 
WHERE streamer_slug = 'ankit';