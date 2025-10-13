-- Add tts_audio_url column to all donation tables for consistency
ALTER TABLE techgamer_donations ADD COLUMN IF NOT EXISTS tts_audio_url TEXT;
ALTER TABLE musicstream_donations ADD COLUMN IF NOT EXISTS tts_audio_url TEXT;
ALTER TABLE fitnessflow_donations ADD COLUMN IF NOT EXISTS tts_audio_url TEXT;
ALTER TABLE codelive_donations ADD COLUMN IF NOT EXISTS tts_audio_url TEXT;
ALTER TABLE artcreate_donations ADD COLUMN IF NOT EXISTS tts_audio_url TEXT;
ALTER TABLE chia_gaming_donations ADD COLUMN IF NOT EXISTS tts_audio_url TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_techgamer_tts ON techgamer_donations(tts_audio_url) WHERE tts_audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_musicstream_tts ON musicstream_donations(tts_audio_url) WHERE tts_audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fitnessflow_tts ON fitnessflow_donations(tts_audio_url) WHERE tts_audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_codelive_tts ON codelive_donations(tts_audio_url) WHERE tts_audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artcreate_tts ON artcreate_donations(tts_audio_url) WHERE tts_audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chia_gaming_tts ON chia_gaming_donations(tts_audio_url) WHERE tts_audio_url IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN techgamer_donations.tts_audio_url IS 'URL to generated TTS audio from text messages';
COMMENT ON COLUMN musicstream_donations.tts_audio_url IS 'URL to generated TTS audio from text messages';
COMMENT ON COLUMN fitnessflow_donations.tts_audio_url IS 'URL to generated TTS audio from text messages';
COMMENT ON COLUMN codelive_donations.tts_audio_url IS 'URL to generated TTS audio from text messages';
COMMENT ON COLUMN artcreate_donations.tts_audio_url IS 'URL to generated TTS audio from text messages';
COMMENT ON COLUMN chia_gaming_donations.tts_audio_url IS 'URL to generated TTS audio from text messages';