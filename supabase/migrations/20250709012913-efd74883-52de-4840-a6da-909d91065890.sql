-- Create moderators table for Telegram bot
CREATE TABLE public.moderators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id TEXT NOT NULL,
  telegram_id BIGINT NOT NULL UNIQUE,
  telegram_username TEXT,
  permissions TEXT[] DEFAULT ARRAY['approve_donations'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.moderators ENABLE ROW LEVEL SECURITY;

-- Create policies for moderators table
CREATE POLICY "Admin can manage moderators" 
ON public.moderators 
FOR ALL 
USING (is_admin_user());

CREATE POLICY "Public can read active moderators for validation" 
ON public.moderators 
FOR SELECT 
USING (is_active = true);

-- Insert sample moderator (replace with actual Telegram ID)
INSERT INTO public.moderators (streamer_id, telegram_id, telegram_username, permissions) 
VALUES ('chiaa_gaming', 123456789, 'sample_mod', ARRAY['approve_donations', 'manage_queue']);

-- Create function to check if user is a moderator
CREATE OR REPLACE FUNCTION public.is_moderator(p_telegram_id BIGINT, p_streamer_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 
    FROM public.moderators 
    WHERE telegram_id = p_telegram_id 
    AND streamer_id = p_streamer_id
    AND is_active = true
    AND 'approve_donations' = ANY(permissions)
  );
END;
$$;