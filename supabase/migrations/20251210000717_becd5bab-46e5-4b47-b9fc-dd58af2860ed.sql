-- Add hypersound_url and currency columns to clumsygod_donations table
ALTER TABLE public.clumsygod_donations 
ADD COLUMN IF NOT EXISTS hypersound_url text,
ADD COLUMN IF NOT EXISTS currency character varying NOT NULL DEFAULT 'INR';