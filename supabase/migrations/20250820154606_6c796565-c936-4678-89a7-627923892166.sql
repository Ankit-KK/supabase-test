-- Add temporary voice data field to store base64 encoded audio until payment success
ALTER TABLE public.chia_gaming_donations 
ADD COLUMN temp_voice_data TEXT;