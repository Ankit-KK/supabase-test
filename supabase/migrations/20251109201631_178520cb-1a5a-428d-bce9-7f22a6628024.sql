-- Update hyperemote minimum amount for testing streamers
UPDATE streamers 
SET hyperemotes_min_amount = 4 
WHERE streamer_slug IN (
  'streamer17', 'streamer18', 'streamer19', 'streamer20', 'streamer21',
  'streamer22', 'streamer23', 'streamer24', 'streamer25'
);