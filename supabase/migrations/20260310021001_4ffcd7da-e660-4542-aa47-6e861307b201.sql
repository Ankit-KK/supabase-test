-- Add status_token_hash column to all 11 donation tables
ALTER TABLE ankit_donations ADD COLUMN IF NOT EXISTS status_token_hash text;
ALTER TABLE chiaa_gaming_donations ADD COLUMN IF NOT EXISTS status_token_hash text;
ALTER TABLE looteriya_gaming_donations ADD COLUMN IF NOT EXISTS status_token_hash text;
ALTER TABLE clumsy_god_donations ADD COLUMN IF NOT EXISTS status_token_hash text;
ALTER TABLE wolfy_donations ADD COLUMN IF NOT EXISTS status_token_hash text;
ALTER TABLE dorp_plays_donations ADD COLUMN IF NOT EXISTS status_token_hash text;
ALTER TABLE zishu_donations ADD COLUMN IF NOT EXISTS status_token_hash text;
ALTER TABLE brigzard_donations ADD COLUMN IF NOT EXISTS status_token_hash text;
ALTER TABLE w_era_donations ADD COLUMN IF NOT EXISTS status_token_hash text;
ALTER TABLE mr_champion_donations ADD COLUMN IF NOT EXISTS status_token_hash text;
ALTER TABLE demigod_donations ADD COLUMN IF NOT EXISTS status_token_hash text;