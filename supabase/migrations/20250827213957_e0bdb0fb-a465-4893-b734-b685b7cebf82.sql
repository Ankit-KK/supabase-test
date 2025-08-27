-- Add mod_notified flag to avoid duplicate Telegram notifications
ALTER TABLE public.ankit_donations
ADD COLUMN IF NOT EXISTS mod_notified boolean NOT NULL DEFAULT false;