-- Add hypersound_url column to ankit_donations for HyperSounds feature
ALTER TABLE public.ankit_donations 
ADD COLUMN IF NOT EXISTS hypersound_url TEXT DEFAULT NULL;