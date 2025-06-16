
-- Add columns to store which custom sound alert was selected
ALTER TABLE public.chiaa_gaming_donations 
ADD COLUMN custom_sound_id TEXT,
ADD COLUMN custom_sound_name TEXT,
ADD COLUMN custom_sound_url TEXT;

-- Add a comment to document the new columns
COMMENT ON COLUMN public.chiaa_gaming_donations.custom_sound_id IS 'ID of the selected custom sound alert (e.g., knock_left, raze_ult, etc.)';
COMMENT ON COLUMN public.chiaa_gaming_donations.custom_sound_name IS 'Display name of the selected custom sound alert';
COMMENT ON COLUMN public.chiaa_gaming_donations.custom_sound_url IS 'URL of the selected custom sound alert audio file';
