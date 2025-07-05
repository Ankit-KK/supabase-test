-- Add hyperemotes_enabled column to chiaa_gaming_donations table
ALTER TABLE public.chiaa_gaming_donations 
ADD COLUMN hyperemotes_enabled BOOLEAN DEFAULT FALSE;