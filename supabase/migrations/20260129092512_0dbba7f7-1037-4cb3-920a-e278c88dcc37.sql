-- Add streamer-controlled minimum amount columns
ALTER TABLE streamers
ADD COLUMN IF NOT EXISTS min_text_amount_inr numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS min_tts_amount_inr numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS min_voice_amount_inr numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS min_hypersound_amount_inr numeric DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN streamers.min_text_amount_inr IS 'Custom minimum for text-only donations in INR. NULL = platform default (40 INR)';
COMMENT ON COLUMN streamers.min_tts_amount_inr IS 'Custom minimum for TTS donations in INR. NULL = platform default (40 INR)';
COMMENT ON COLUMN streamers.min_voice_amount_inr IS 'Custom minimum for voice recordings in INR. NULL = platform default (150 INR)';
COMMENT ON COLUMN streamers.min_hypersound_amount_inr IS 'Custom minimum for HyperSounds in INR. NULL = platform default (30 INR)';