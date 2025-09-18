-- Create donation tables for 5 new streamers following existing schema
CREATE TABLE public.techgamer_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  moderation_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  cashfree_order_id TEXT,
  order_id TEXT,
  streamer_id UUID,
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  voice_duration_seconds INTEGER,
  mod_notified BOOLEAN NOT NULL DEFAULT false,
  auto_verified BOOLEAN DEFAULT false,
  last_verification_attempt TIMESTAMP WITH TIME ZONE,
  processing_status TEXT DEFAULT 'pending',
  emotion_tags TEXT[],
  emotion_tier TEXT DEFAULT 'basic',
  tts_segments JSONB,
  tts_audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.musicstream_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  moderation_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  cashfree_order_id TEXT,
  order_id TEXT,
  streamer_id UUID,
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  voice_duration_seconds INTEGER,
  mod_notified BOOLEAN NOT NULL DEFAULT false,
  auto_verified BOOLEAN DEFAULT false,
  last_verification_attempt TIMESTAMP WITH TIME ZONE,
  processing_status TEXT DEFAULT 'pending',
  emotion_tags TEXT[],
  emotion_tier TEXT DEFAULT 'basic',
  tts_segments JSONB,
  tts_audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.codelive_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  moderation_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  cashfree_order_id TEXT,
  order_id TEXT,
  streamer_id UUID,
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  voice_duration_seconds INTEGER,
  mod_notified BOOLEAN NOT NULL DEFAULT false,
  auto_verified BOOLEAN DEFAULT false,
  last_verification_attempt TIMESTAMP WITH TIME ZONE,
  processing_status TEXT DEFAULT 'pending',
  emotion_tags TEXT[],
  emotion_tier TEXT DEFAULT 'basic',
  tts_segments JSONB,
  tts_audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.artcreate_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  moderation_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  cashfree_order_id TEXT,
  order_id TEXT,
  streamer_id UUID,
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  voice_duration_seconds INTEGER,
  mod_notified BOOLEAN NOT NULL DEFAULT false,
  auto_verified BOOLEAN DEFAULT false,
  last_verification_attempt TIMESTAMP WITH TIME ZONE,
  processing_status TEXT DEFAULT 'pending',
  emotion_tags TEXT[],
  emotion_tier TEXT DEFAULT 'basic',
  tts_segments JSONB,
  tts_audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.fitnessflow_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  moderation_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  cashfree_order_id TEXT,
  order_id TEXT,
  streamer_id UUID,
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  voice_duration_seconds INTEGER,
  mod_notified BOOLEAN NOT NULL DEFAULT false,
  auto_verified BOOLEAN DEFAULT false,
  last_verification_attempt TIMESTAMP WITH TIME ZONE,
  processing_status TEXT DEFAULT 'pending',
  emotion_tags TEXT[],
  emotion_tier TEXT DEFAULT 'basic',
  tts_segments JSONB,
  tts_audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.techgamer_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.musicstream_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codelive_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artcreate_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitnessflow_donations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for techgamer_donations
CREATE POLICY "Admins full access to techgamer_donations" 
ON public.techgamer_donations 
FOR ALL 
USING (is_admin_email(auth.email()))
WITH CHECK (is_admin_email(auth.email()));

CREATE POLICY "Allow secure donation creation on techgamer_donations" 
ON public.techgamer_donations 
FOR INSERT 
WITH CHECK (validate_donation_insert(amount, name, message, streamer_id) AND payment_status = 'pending' AND moderation_status = 'pending');

CREATE POLICY "Service role can update payment status techgamer" 
ON public.techgamer_donations 
FOR UPDATE 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Streamers view own techgamer_donations" 
ON public.techgamer_donations 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND streamer_id IN (SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()));

CREATE POLICY "Streamers limited update on techgamer_donations" 
ON public.techgamer_donations 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND streamer_id IN (SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()));

CREATE POLICY "Deny anonymous read access to techgamer_donations" 
ON public.techgamer_donations 
FOR SELECT 
USING (false);

CREATE POLICY "Deny anonymous update/delete on techgamer_donations" 
ON public.techgamer_donations 
FOR UPDATE 
USING (false);

CREATE POLICY "Deny anonymous delete on techgamer_donations" 
ON public.techgamer_donations 
FOR DELETE 
USING (false);

-- Create RLS policies for musicstream_donations
CREATE POLICY "Admins full access to musicstream_donations" 
ON public.musicstream_donations 
FOR ALL 
USING (is_admin_email(auth.email()))
WITH CHECK (is_admin_email(auth.email()));

CREATE POLICY "Allow secure donation creation on musicstream_donations" 
ON public.musicstream_donations 
FOR INSERT 
WITH CHECK (validate_donation_insert(amount, name, message, streamer_id) AND payment_status = 'pending' AND moderation_status = 'pending');

CREATE POLICY "Service role can update payment status musicstream" 
ON public.musicstream_donations 
FOR UPDATE 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Streamers view own musicstream_donations" 
ON public.musicstream_donations 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND streamer_id IN (SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()));

CREATE POLICY "Streamers limited update on musicstream_donations" 
ON public.musicstream_donations 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND streamer_id IN (SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()));

CREATE POLICY "Deny anonymous read access to musicstream_donations" 
ON public.musicstream_donations 
FOR SELECT 
USING (false);

CREATE POLICY "Deny anonymous update/delete on musicstream_donations" 
ON public.musicstream_donations 
FOR UPDATE 
USING (false);

CREATE POLICY "Deny anonymous delete on musicstream_donations" 
ON public.musicstream_donations 
FOR DELETE 
USING (false);

-- Create RLS policies for codelive_donations
CREATE POLICY "Admins full access to codelive_donations" 
ON public.codelive_donations 
FOR ALL 
USING (is_admin_email(auth.email()))
WITH CHECK (is_admin_email(auth.email()));

CREATE POLICY "Allow secure donation creation on codelive_donations" 
ON public.codelive_donations 
FOR INSERT 
WITH CHECK (validate_donation_insert(amount, name, message, streamer_id) AND payment_status = 'pending' AND moderation_status = 'pending');

CREATE POLICY "Service role can update payment status codelive" 
ON public.codelive_donations 
FOR UPDATE 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Streamers view own codelive_donations" 
ON public.codelive_donations 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND streamer_id IN (SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()));

CREATE POLICY "Streamers limited update on codelive_donations" 
ON public.codelive_donations 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND streamer_id IN (SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()));

CREATE POLICY "Deny anonymous read access to codelive_donations" 
ON public.codelive_donations 
FOR SELECT 
USING (false);

CREATE POLICY "Deny anonymous update/delete on codelive_donations" 
ON public.codelive_donations 
FOR UPDATE 
USING (false);

CREATE POLICY "Deny anonymous delete on codelive_donations" 
ON public.codelive_donations 
FOR DELETE 
USING (false);

-- Create RLS policies for artcreate_donations
CREATE POLICY "Admins full access to artcreate_donations" 
ON public.artcreate_donations 
FOR ALL 
USING (is_admin_email(auth.email()))
WITH CHECK (is_admin_email(auth.email()));

CREATE POLICY "Allow secure donation creation on artcreate_donations" 
ON public.artcreate_donations 
FOR INSERT 
WITH CHECK (validate_donation_insert(amount, name, message, streamer_id) AND payment_status = 'pending' AND moderation_status = 'pending');

CREATE POLICY "Service role can update payment status artcreate" 
ON public.artcreate_donations 
FOR UPDATE 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Streamers view own artcreate_donations" 
ON public.artcreate_donations 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND streamer_id IN (SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()));

CREATE POLICY "Streamers limited update on artcreate_donations" 
ON public.artcreate_donations 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND streamer_id IN (SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()));

CREATE POLICY "Deny anonymous read access to artcreate_donations" 
ON public.artcreate_donations 
FOR SELECT 
USING (false);

CREATE POLICY "Deny anonymous update/delete on artcreate_donations" 
ON public.artcreate_donations 
FOR UPDATE 
USING (false);

CREATE POLICY "Deny anonymous delete on artcreate_donations" 
ON public.artcreate_donations 
FOR DELETE 
USING (false);

-- Create RLS policies for fitnessflow_donations
CREATE POLICY "Admins full access to fitnessflow_donations" 
ON public.fitnessflow_donations 
FOR ALL 
USING (is_admin_email(auth.email()))
WITH CHECK (is_admin_email(auth.email()));

CREATE POLICY "Allow secure donation creation on fitnessflow_donations" 
ON public.fitnessflow_donations 
FOR INSERT 
WITH CHECK (validate_donation_insert(amount, name, message, streamer_id) AND payment_status = 'pending' AND moderation_status = 'pending');

CREATE POLICY "Service role can update payment status fitnessflow" 
ON public.fitnessflow_donations 
FOR UPDATE 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Streamers view own fitnessflow_donations" 
ON public.fitnessflow_donations 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND streamer_id IN (SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()));

CREATE POLICY "Streamers limited update on fitnessflow_donations" 
ON public.fitnessflow_donations 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND streamer_id IN (SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()));

CREATE POLICY "Deny anonymous read access to fitnessflow_donations" 
ON public.fitnessflow_donations 
FOR SELECT 
USING (false);

CREATE POLICY "Deny anonymous update/delete on fitnessflow_donations" 
ON public.fitnessflow_donations 
FOR UPDATE 
USING (false);

CREATE POLICY "Deny anonymous delete on fitnessflow_donations" 
ON public.fitnessflow_donations 
FOR DELETE 
USING (false);

-- Create auto-approve triggers for hyperemotes
CREATE TRIGGER auto_approve_techgamer_hyperemotes_trigger
BEFORE INSERT OR UPDATE ON public.techgamer_donations
FOR EACH ROW EXECUTE FUNCTION public.auto_approve_hyperemotes();

CREATE TRIGGER auto_approve_musicstream_hyperemotes_trigger
BEFORE INSERT OR UPDATE ON public.musicstream_donations
FOR EACH ROW EXECUTE FUNCTION public.auto_approve_hyperemotes();

CREATE TRIGGER auto_approve_codelive_hyperemotes_trigger
BEFORE INSERT OR UPDATE ON public.codelive_donations
FOR EACH ROW EXECUTE FUNCTION public.auto_approve_hyperemotes();

CREATE TRIGGER auto_approve_artcreate_hyperemotes_trigger
BEFORE INSERT OR UPDATE ON public.artcreate_donations
FOR EACH ROW EXECUTE FUNCTION public.auto_approve_hyperemotes();

CREATE TRIGGER auto_approve_fitnessflow_hyperemotes_trigger
BEFORE INSERT OR UPDATE ON public.fitnessflow_donations
FOR EACH ROW EXECUTE FUNCTION public.auto_approve_hyperemotes();

-- Create updated_at triggers
CREATE TRIGGER update_techgamer_donations_updated_at
BEFORE UPDATE ON public.techgamer_donations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_musicstream_donations_updated_at
BEFORE UPDATE ON public.musicstream_donations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_codelive_donations_updated_at
BEFORE UPDATE ON public.codelive_donations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artcreate_donations_updated_at
BEFORE UPDATE ON public.artcreate_donations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fitnessflow_donations_updated_at
BEFORE UPDATE ON public.fitnessflow_donations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add new streamers to streamers table
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, hyperemotes_enabled, hyperemotes_min_amount) VALUES
('techgamer', 'TechGamer', '#3b82f6', true, 50),
('musicstream', 'MusicStream', '#7c3aed', true, 50),
('codelive', 'CodeLive', '#16a34a', true, 50),
('artcreate', 'ArtCreate', '#ec4899', true, 50),
('fitnessflow', 'FitnessFlow', '#ea580c', true, 50);