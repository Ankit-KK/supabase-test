-- Add hyperemote support to donations table
ALTER TABLE public.chia_gaming_donations 
ADD COLUMN is_hyperemote BOOLEAN DEFAULT false;

-- Add hyperemote settings to streamers table
ALTER TABLE public.streamers 
ADD COLUMN hyperemotes_enabled BOOLEAN DEFAULT true,
ADD COLUMN hyperemotes_min_amount NUMERIC DEFAULT 50;