-- Remove unused gif_url column from new streamer tables
ALTER TABLE apexlegend_donations DROP COLUMN IF EXISTS gif_url;
ALTER TABLE craftmaster_donations DROP COLUMN IF EXISTS gif_url;
ALTER TABLE lofibeats_donations DROP COLUMN IF EXISTS gif_url;
ALTER TABLE valorantpro_donations DROP COLUMN IF EXISTS gif_url;
ALTER TABLE yogatime_donations DROP COLUMN IF EXISTS gif_url;

-- Add TTS audio URL column to new streamer tables
ALTER TABLE apexlegend_donations ADD COLUMN IF NOT EXISTS tts_audio_url TEXT;
ALTER TABLE craftmaster_donations ADD COLUMN IF NOT EXISTS tts_audio_url TEXT;
ALTER TABLE lofibeats_donations ADD COLUMN IF NOT EXISTS tts_audio_url TEXT;
ALTER TABLE valorantpro_donations ADD COLUMN IF NOT EXISTS tts_audio_url TEXT;
ALTER TABLE yogatime_donations ADD COLUMN IF NOT EXISTS tts_audio_url TEXT;

-- Add audio played timestamp column to new streamer tables
ALTER TABLE apexlegend_donations ADD COLUMN IF NOT EXISTS audio_played_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE craftmaster_donations ADD COLUMN IF NOT EXISTS audio_played_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE lofibeats_donations ADD COLUMN IF NOT EXISTS audio_played_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE valorantpro_donations ADD COLUMN IF NOT EXISTS audio_played_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE yogatime_donations ADD COLUMN IF NOT EXISTS audio_played_at TIMESTAMP WITH TIME ZONE;