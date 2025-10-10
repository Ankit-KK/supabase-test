-- Add audio_played_at column to all donation tables for audio player queue tracking

ALTER TABLE ankit_donations ADD COLUMN audio_played_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE chia_gaming_donations ADD COLUMN audio_played_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE demostreamer_donations ADD COLUMN audio_played_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE techgamer_donations ADD COLUMN audio_played_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE musicstream_donations ADD COLUMN audio_played_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE fitnessflow_donations ADD COLUMN audio_played_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE codelive_donations ADD COLUMN audio_played_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE artcreate_donations ADD COLUMN audio_played_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for efficient queries on audio_played_at
CREATE INDEX idx_ankit_donations_audio_played ON ankit_donations(audio_played_at) WHERE audio_played_at IS NULL;
CREATE INDEX idx_chia_gaming_donations_audio_played ON chia_gaming_donations(audio_played_at) WHERE audio_played_at IS NULL;
CREATE INDEX idx_demostreamer_donations_audio_played ON demostreamer_donations(audio_played_at) WHERE audio_played_at IS NULL;
CREATE INDEX idx_techgamer_donations_audio_played ON techgamer_donations(audio_played_at) WHERE audio_played_at IS NULL;
CREATE INDEX idx_musicstream_donations_audio_played ON musicstream_donations(audio_played_at) WHERE audio_played_at IS NULL;
CREATE INDEX idx_fitnessflow_donations_audio_played ON fitnessflow_donations(audio_played_at) WHERE audio_played_at IS NULL;
CREATE INDEX idx_codelive_donations_audio_played ON codelive_donations(audio_played_at) WHERE audio_played_at IS NULL;
CREATE INDEX idx_artcreate_donations_audio_played ON artcreate_donations(audio_played_at) WHERE audio_played_at IS NULL;