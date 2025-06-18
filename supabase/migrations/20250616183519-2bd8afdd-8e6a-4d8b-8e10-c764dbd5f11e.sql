
-- Add voice recording columns to chiaa_gaming_donations table
ALTER TABLE public.chiaa_gaming_donations 
ADD COLUMN voice_url TEXT,
ADD COLUMN voice_file_name TEXT,
ADD COLUMN voice_file_size INTEGER;

-- Update donation_gifs table to handle both GIFs and voice recordings
ALTER TABLE public.donation_gifs 
ADD COLUMN file_type TEXT DEFAULT 'gif' CHECK (file_type IN ('gif', 'voice'));

-- Update the table name to be more generic (optional, but more accurate)
-- We'll keep using donation_gifs for now to avoid breaking existing functionality
