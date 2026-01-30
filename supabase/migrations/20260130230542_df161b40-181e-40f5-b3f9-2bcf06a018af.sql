-- Create wolfy_donations table
CREATE TABLE wolfy_donations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id uuid REFERENCES streamers(id),
  name text NOT NULL,
  amount numeric NOT NULL,
  currency varchar DEFAULT 'INR',
  message text,
  voice_message_url text,
  temp_voice_data text,
  tts_audio_url text,
  hypersound_url text,
  is_hyperemote boolean DEFAULT false,
  media_url text,
  media_type text,
  order_id text,
  razorpay_order_id text,
  payment_status text DEFAULT 'pending',
  moderation_status text DEFAULT 'pending',
  approved_by text,
  approved_at timestamptz,
  mod_notified boolean DEFAULT false,
  message_visible boolean DEFAULT true,
  audio_scheduled_at timestamptz,
  audio_played_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wolfy_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (match other streamers)
CREATE POLICY "Anyone can create wolfy donations" ON wolfy_donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view approved wolfy donations" ON wolfy_donations FOR SELECT
  USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');
CREATE POLICY "Service role can manage wolfy donations" ON wolfy_donations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Register Wolfy streamer
INSERT INTO streamers (
  streamer_slug, 
  streamer_name, 
  brand_color,
  min_text_amount_inr,
  min_tts_amount_inr,
  min_voice_amount_inr,
  min_hypersound_amount_inr,
  media_min_amount,
  tts_enabled,
  moderation_mode,
  pusher_group
) VALUES (
  'wolfy',
  'Wolfy',
  '#f59e0b',
  40,
  70,
  150,
  30,
  100,
  true,
  'auto_approve',
  1
);