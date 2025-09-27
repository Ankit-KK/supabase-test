-- Update hyperemote minimum amount from 50 to 1
ALTER TABLE public.streamers 
ALTER COLUMN hyperemotes_min_amount SET DEFAULT 1;

-- Update existing streamers to use the new minimum
UPDATE public.streamers 
SET hyperemotes_min_amount = 1 
WHERE hyperemotes_min_amount = 50;