-- Create donations table for Damask plays
CREATE TABLE damask_plays_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  tts_audio_url TEXT,
  order_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  audio_played_at TIMESTAMP WITH TIME ZONE,
  mod_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_damask_plays_donations_order_id ON damask_plays_donations(order_id);
CREATE INDEX idx_damask_plays_donations_payment_status ON damask_plays_donations(payment_status);
CREATE INDEX idx_damask_plays_donations_moderation_status ON damask_plays_donations(moderation_status);

-- Enable RLS
ALTER TABLE damask_plays_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view approved donations
CREATE POLICY "Anyone can view approved donations" ON damask_plays_donations
  FOR SELECT
  USING (
    moderation_status IN ('approved', 'auto_approved') 
    AND payment_status = 'success'
  );

-- RLS Policy: Service role can manage all donations
CREATE POLICY "Service role can manage all donations" ON damask_plays_donations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Insert streamer record
INSERT INTO streamers (streamer_slug, streamer_name, brand_color, hyperemotes_enabled, hyperemotes_min_amount, pusher_group)
VALUES ('damask_plays', 'Damask plays', '#10b981', true, 50, 1)
ON CONFLICT (streamer_slug) DO NOTHING;