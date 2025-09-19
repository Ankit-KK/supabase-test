-- Add temp_voice_data column to other donation tables for consistency
ALTER TABLE public.chia_gaming_donations 
ADD COLUMN temp_voice_data TEXT;

ALTER TABLE public.demostreamer_donations 
ADD COLUMN temp_voice_data TEXT;