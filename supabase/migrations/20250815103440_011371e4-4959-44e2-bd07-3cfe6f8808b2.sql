-- Add message_visible column to chia_gaming_donations
ALTER TABLE public.chia_gaming_donations 
ADD COLUMN IF NOT EXISTS message_visible BOOLEAN DEFAULT true;