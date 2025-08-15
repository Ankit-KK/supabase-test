UPDATE streamers 
SET user_id = (SELECT auth.uid())
WHERE streamer_slug = 'chia_gaming' AND user_id IS NULL;