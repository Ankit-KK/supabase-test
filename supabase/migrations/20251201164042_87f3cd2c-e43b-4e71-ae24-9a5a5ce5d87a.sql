-- Add goal management columns to streamers table
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS goal_name TEXT;
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS goal_target_amount NUMERIC;
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS goal_activated_at TIMESTAMPTZ;
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS goal_is_active BOOLEAN DEFAULT false;