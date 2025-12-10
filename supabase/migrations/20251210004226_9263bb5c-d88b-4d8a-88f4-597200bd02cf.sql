-- Add audio_scheduled_at column to all donation tables
-- This column stores the absolute time when the audio should be played

ALTER TABLE ankit_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE clumsygod_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE thunderx_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE vipbhai_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE sagarujjwalgaming_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE notyourkween_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE bongflick_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE mriqmaster_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE abdevil_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE looteriya_gaming_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE damask_plays_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE neko_xenpai_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE jhanvoo_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE chiaa_gaming_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;
ALTER TABLE sizzors_donations ADD COLUMN IF NOT EXISTS audio_scheduled_at timestamptz;

-- Create indexes for efficient querying by scheduled time
CREATE INDEX IF NOT EXISTS idx_ankit_donations_audio_scheduled ON ankit_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clumsygod_donations_audio_scheduled ON clumsygod_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_thunderx_donations_audio_scheduled ON thunderx_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vipbhai_donations_audio_scheduled ON vipbhai_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sagarujjwalgaming_donations_audio_scheduled ON sagarujjwalgaming_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notyourkween_donations_audio_scheduled ON notyourkween_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bongflick_donations_audio_scheduled ON bongflick_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mriqmaster_donations_audio_scheduled ON mriqmaster_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_abdevil_donations_audio_scheduled ON abdevil_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_looteriya_gaming_donations_audio_scheduled ON looteriya_gaming_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_damask_plays_donations_audio_scheduled ON damask_plays_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_neko_xenpai_donations_audio_scheduled ON neko_xenpai_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jhanvoo_donations_audio_scheduled ON jhanvoo_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chiaa_gaming_donations_audio_scheduled ON chiaa_gaming_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sizzors_donations_audio_scheduled ON sizzors_donations(audio_scheduled_at) WHERE audio_played_at IS NULL;