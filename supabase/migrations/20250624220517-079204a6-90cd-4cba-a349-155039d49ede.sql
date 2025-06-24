
-- Add column to track when voice messages are last played from dashboard
ALTER TABLE public.donation_gifs 
ADD COLUMN last_played_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient cleanup queries (using uploaded_at instead of created_at)
CREATE INDEX idx_donation_gifs_cleanup 
ON public.donation_gifs (file_type, status, last_played_at, uploaded_at) 
WHERE file_type = 'voice';
