-- Add TTS voice configuration columns to streamers table
ALTER TABLE public.streamers 
ADD COLUMN IF NOT EXISTS tts_voice_id TEXT DEFAULT 'moss_audio_3e9334b7-e32a-11f0-ba34-ee3bcee0a7c9',
ADD COLUMN IF NOT EXISTS tts_enabled BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.streamers.tts_voice_id IS 'MiniMax TTS voice ID for this streamer';
COMMENT ON COLUMN public.streamers.tts_enabled IS 'Whether TTS is enabled for this streamer';