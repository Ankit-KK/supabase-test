-- Create streamers_moderators table to manage Telegram bot moderators
CREATE TABLE public.streamers_moderators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID NOT NULL REFERENCES public.streamers(id) ON DELETE CASCADE,
  telegram_user_id TEXT NOT NULL,
  mod_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate moderator assignments
CREATE UNIQUE INDEX streamers_moderators_unique_active 
ON public.streamers_moderators (streamer_id, telegram_user_id) 
WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.streamers_moderators ENABLE ROW LEVEL SECURITY;

-- Create policies for streamers_moderators
CREATE POLICY "Streamers can manage their own moderators"
ON public.streamers_moderators
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.streamers s 
    WHERE s.id = streamers_moderators.streamer_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can access all moderators"
ON public.streamers_moderators
FOR ALL
USING (current_setting('role') = 'service_role');

-- Insert some initial moderators for testing
INSERT INTO public.streamers_moderators (streamer_id, telegram_user_id, mod_name)
SELECT s.id, '123456789', 'Test Moderator'
FROM public.streamers s 
WHERE s.streamer_slug = 'ankit';

-- Create function to get moderator by telegram user ID
CREATE OR REPLACE FUNCTION public.get_moderator_by_telegram_id(p_telegram_user_id TEXT)
RETURNS TABLE(
  streamer_id UUID,
  streamer_slug TEXT,
  mod_name TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.streamer_id,
    s.streamer_slug,
    sm.mod_name,
    sm.is_active
  FROM public.streamers_moderators sm
  INNER JOIN public.streamers s ON sm.streamer_id = s.id
  WHERE sm.telegram_user_id = p_telegram_user_id
    AND sm.is_active = true;
END;
$$;