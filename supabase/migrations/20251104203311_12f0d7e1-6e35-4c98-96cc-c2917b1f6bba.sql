-- Phase 1: Add pusher_group column to streamers table
ALTER TABLE streamers 
ADD COLUMN pusher_group INTEGER DEFAULT 1 
CHECK (pusher_group >= 1 AND pusher_group <= 10);

-- Add index for performance
CREATE INDEX idx_streamers_pusher_group ON streamers(pusher_group);

-- Add comment for documentation
COMMENT ON COLUMN streamers.pusher_group IS 'Pusher account group (1-10). Determines which Pusher credentials to use for real-time events.';

-- Assign existing 16 streamers to Group 1
UPDATE streamers SET pusher_group = 1, updated_at = now() 
WHERE streamer_slug IN (
  'ankit', 'apexlegend', 'artcreate', 'chiaa_gaming', 
  'codelive', 'craftmaster', 'demostreamer', 'demo2',
  'demo3', 'demo4', 'fitnessflow', 'lofibeats',
  'musicstream', 'techgamer', 'valorantpro', 'yogatime'
);

-- Insert 30 new streamers
INSERT INTO streamers (streamer_slug, streamer_name, brand_color, pusher_group, hyperemotes_enabled, hyperemotes_min_amount) VALUES
-- Group 1 additions (2 more to test, total will be 18 in group 1 for now)
('streamer17', 'Streamer 17', '#f59e0b', 1, true, 50),
('streamer18', 'Streamer 18', '#10b981', 1, true, 50),

-- Group 2 (15 streamers)
('streamer19', 'Streamer 19', '#8b5cf6', 2, true, 50),
('streamer20', 'Streamer 20', '#ec4899', 2, true, 50),
('streamer21', 'Streamer 21', '#f97316', 2, true, 50),
('streamer22', 'Streamer 22', '#14b8a6', 2, true, 50),
('streamer23', 'Streamer 23', '#06b6d4', 2, true, 50),
('streamer24', 'Streamer 24', '#6366f1', 2, true, 50),
('streamer25', 'Streamer 25', '#a855f7', 2, true, 50),
('streamer26', 'Streamer 26', '#e11d48', 2, true, 50),
('streamer27', 'Streamer 27', '#f59e0b', 2, true, 50),
('streamer28', 'Streamer 28', '#10b981', 2, true, 50),
('streamer29', 'Streamer 29', '#8b5cf6', 2, true, 50),
('streamer30', 'Streamer 30', '#ec4899', 2, true, 50),
('streamer31', 'Streamer 31', '#f97316', 2, true, 50),
('streamer32', 'Streamer 32', '#14b8a6', 2, true, 50),
('streamer33', 'Streamer 33', '#06b6d4', 2, true, 50),

-- Group 3 (15 streamers)
('streamer34', 'Streamer 34', '#6366f1', 3, true, 50),
('streamer35', 'Streamer 35', '#a855f7', 3, true, 50),
('streamer36', 'Streamer 36', '#e11d48', 3, true, 50),
('streamer37', 'Streamer 37', '#f59e0b', 3, true, 50),
('streamer38', 'Streamer 38', '#10b981', 3, true, 50),
('streamer39', 'Streamer 39', '#8b5cf6', 3, true, 50),
('streamer40', 'Streamer 40', '#ec4899', 3, true, 50),
('streamer41', 'Streamer 41', '#f97316', 3, true, 50),
('streamer42', 'Streamer 42', '#14b8a6', 3, true, 50),
('streamer43', 'Streamer 43', '#06b6d4', 3, true, 50),
('streamer44', 'Streamer 44', '#6366f1', 3, true, 50),
('streamer45', 'Streamer 45', '#a855f7', 3, true, 50),
('streamer46', 'Streamer 46', '#e11d48', 3, true, 50);

-- Create donation tables for all 30 new streamers with RLS policies and triggers
-- Streamer 17
CREATE TABLE streamer17_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer17_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer17_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer17_hyperemotes BEFORE INSERT OR UPDATE ON streamer17_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 18
CREATE TABLE streamer18_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer18_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer18_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer18_hyperemotes BEFORE INSERT OR UPDATE ON streamer18_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 19
CREATE TABLE streamer19_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer19_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer19_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer19_hyperemotes BEFORE INSERT OR UPDATE ON streamer19_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 20
CREATE TABLE streamer20_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer20_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer20_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer20_hyperemotes BEFORE INSERT OR UPDATE ON streamer20_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 21
CREATE TABLE streamer21_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer21_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer21_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer21_hyperemotes BEFORE INSERT OR UPDATE ON streamer21_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 22
CREATE TABLE streamer22_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer22_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer22_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer22_hyperemotes BEFORE INSERT OR UPDATE ON streamer22_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 23
CREATE TABLE streamer23_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer23_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer23_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer23_hyperemotes BEFORE INSERT OR UPDATE ON streamer23_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 24
CREATE TABLE streamer24_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer24_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer24_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer24_hyperemotes BEFORE INSERT OR UPDATE ON streamer24_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 25
CREATE TABLE streamer25_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer25_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer25_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer25_hyperemotes BEFORE INSERT OR UPDATE ON streamer25_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 26
CREATE TABLE streamer26_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer26_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer26_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer26_hyperemotes BEFORE INSERT OR UPDATE ON streamer26_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 27
CREATE TABLE streamer27_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer27_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer27_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer27_hyperemotes BEFORE INSERT OR UPDATE ON streamer27_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 28
CREATE TABLE streamer28_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer28_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer28_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer28_hyperemotes BEFORE INSERT OR UPDATE ON streamer28_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 29
CREATE TABLE streamer29_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer29_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer29_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer29_hyperemotes BEFORE INSERT OR UPDATE ON streamer29_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 30
CREATE TABLE streamer30_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer30_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer30_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer30_hyperemotes BEFORE INSERT OR UPDATE ON streamer30_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 31
CREATE TABLE streamer31_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer31_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer31_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer31_hyperemotes BEFORE INSERT OR UPDATE ON streamer31_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 32
CREATE TABLE streamer32_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer32_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer32_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer32_hyperemotes BEFORE INSERT OR UPDATE ON streamer32_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 33
CREATE TABLE streamer33_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer33_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer33_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer33_hyperemotes BEFORE INSERT OR UPDATE ON streamer33_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 34
CREATE TABLE streamer34_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer34_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer34_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer34_hyperemotes BEFORE INSERT OR UPDATE ON streamer34_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 35
CREATE TABLE streamer35_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer35_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer35_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer35_hyperemotes BEFORE INSERT OR UPDATE ON streamer35_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 36
CREATE TABLE streamer36_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer36_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer36_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer36_hyperemotes BEFORE INSERT OR UPDATE ON streamer36_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 37
CREATE TABLE streamer37_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer37_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer37_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer37_hyperemotes BEFORE INSERT OR UPDATE ON streamer37_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 38
CREATE TABLE streamer38_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer38_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer38_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer38_hyperemotes BEFORE INSERT OR UPDATE ON streamer38_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 39
CREATE TABLE streamer39_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer39_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer39_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer39_hyperemotes BEFORE INSERT OR UPDATE ON streamer39_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 40
CREATE TABLE streamer40_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer40_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer40_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer40_hyperemotes BEFORE INSERT OR UPDATE ON streamer40_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 41
CREATE TABLE streamer41_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer41_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer41_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer41_hyperemotes BEFORE INSERT OR UPDATE ON streamer41_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 42
CREATE TABLE streamer42_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer42_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer42_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer42_hyperemotes BEFORE INSERT OR UPDATE ON streamer42_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 43
CREATE TABLE streamer43_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer43_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer43_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer43_hyperemotes BEFORE INSERT OR UPDATE ON streamer43_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 44
CREATE TABLE streamer44_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer44_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer44_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer44_hyperemotes BEFORE INSERT OR UPDATE ON streamer44_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 45
CREATE TABLE streamer45_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer45_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer45_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer45_hyperemotes BEFORE INSERT OR UPDATE ON streamer45_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();

-- Streamer 46
CREATE TABLE streamer46_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
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

ALTER TABLE streamer46_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved donations" ON streamer46_donations FOR SELECT 
USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE TRIGGER auto_approve_streamer46_hyperemotes BEFORE INSERT OR UPDATE ON streamer46_donations
FOR EACH ROW EXECUTE FUNCTION auto_approve_newstreamer_hyperemotes();