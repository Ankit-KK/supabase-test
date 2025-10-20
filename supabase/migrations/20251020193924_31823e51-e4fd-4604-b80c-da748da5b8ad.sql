-- Add tts_audio_url column to demostreamer_donations table
ALTER TABLE public.demostreamer_donations 
ADD COLUMN tts_audio_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.demostreamer_donations.tts_audio_url 
IS 'URL to the generated text-to-speech audio file for text donations';