-- Rename the donations table from chia_gaming_donations to chiaa_gaming_donations
ALTER TABLE chia_gaming_donations RENAME TO chiaa_gaming_donations;

-- Update the streamer slug from chia_gaming to chiaa_gaming
UPDATE streamers 
SET streamer_slug = 'chiaa_gaming'
WHERE streamer_slug = 'chia_gaming';

-- Add comment for documentation
COMMENT ON TABLE chiaa_gaming_donations IS 'Donations table for Chiaa Gaming streamer (standardized spelling with two a)';
