-- Create callback mapping table for shortened Telegram button data
CREATE TABLE public.telegram_callback_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id VARCHAR(8) UNIQUE NOT NULL,
  donation_id UUID NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  streamer_id UUID NOT NULL REFERENCES public.streamers(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Create indexes for fast lookups
CREATE INDEX idx_callback_short_id ON public.telegram_callback_mapping(short_id);
CREATE INDEX idx_callback_expires ON public.telegram_callback_mapping(expires_at);
CREATE INDEX idx_callback_donation ON public.telegram_callback_mapping(donation_id);

-- Enable RLS
ALTER TABLE public.telegram_callback_mapping ENABLE ROW LEVEL SECURITY;

-- Allow all operations (service role will be used from edge functions)
CREATE POLICY "Allow all operations for telegram callbacks" 
ON public.telegram_callback_mapping 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create cleanup function to remove expired mappings
CREATE OR REPLACE FUNCTION public.cleanup_expired_callback_mappings()
RETURNS void AS $$
BEGIN
  DELETE FROM public.telegram_callback_mapping WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;