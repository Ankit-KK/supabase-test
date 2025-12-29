-- Add telegram_moderation_enabled column to streamers table
ALTER TABLE public.streamers 
ADD COLUMN IF NOT EXISTS telegram_moderation_enabled BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.streamers.telegram_moderation_enabled IS 'Whether Telegram moderation buttons (approve/reject) are enabled for this streamer';