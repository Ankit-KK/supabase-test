-- Add Emotional TTS columns to ankit_donations table
ALTER TABLE public.ankit_donations 
ADD COLUMN emotion_tags text[],
ADD COLUMN tts_audio_url text,
ADD COLUMN emotion_tier text DEFAULT 'basic',
ADD COLUMN tts_segments jsonb,
ADD COLUMN processing_status text DEFAULT 'pending';

-- Create index for efficient querying
CREATE INDEX idx_ankit_donations_emotion_tier ON public.ankit_donations(emotion_tier);
CREATE INDEX idx_ankit_donations_processing_status ON public.ankit_donations(processing_status);