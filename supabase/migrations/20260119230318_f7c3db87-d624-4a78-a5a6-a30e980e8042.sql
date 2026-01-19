-- Add media upload settings to streamers table
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS media_upload_enabled BOOLEAN DEFAULT false;
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS media_moderation_enabled BOOLEAN DEFAULT true;
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS media_min_amount NUMERIC DEFAULT 100;
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS media_max_file_size_mb NUMERIC DEFAULT 10;

-- Add media columns to all donation tables
ALTER TABLE abdevil_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE abdevil_donations ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE ankit_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE ankit_donations ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE bongflick_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE bongflick_donations ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE chiaa_gaming_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE chiaa_gaming_donations ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE clumsygod_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE clumsygod_donations ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE damask_plays_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE damask_plays_donations ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE jhanvoo_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE jhanvoo_donations ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE jimmy_gaming_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE jimmy_gaming_donations ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE looteriya_gaming_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE looteriya_gaming_donations ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE mriqmaster_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE mriqmaster_donations ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE neko_xenpai_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE neko_xenpai_donations ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE notyourkween_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE notyourkween_donations ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE sagarujjwalgaming_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE sagarujjwalgaming_donations ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE sizzors_donations ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE sizzors_donations ADD COLUMN IF NOT EXISTS media_type TEXT;