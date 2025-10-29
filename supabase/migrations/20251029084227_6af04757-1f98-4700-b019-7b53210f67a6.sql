-- ============================================
-- Add 5 New Streamers: valorantpro, craftmaster, apexlegend, lofibeats, yogatime
-- ============================================

-- ============================================
-- 1. CREATE DONATION TABLES
-- ============================================

-- Table: valorantpro_donations
CREATE TABLE IF NOT EXISTS public.valorantpro_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID REFERENCES public.streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 1 AND amount <= 100000),
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  gif_url TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'auto_approved', 'rejected')),
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: craftmaster_donations
CREATE TABLE IF NOT EXISTS public.craftmaster_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID REFERENCES public.streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 1 AND amount <= 100000),
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  gif_url TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'auto_approved', 'rejected')),
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: apexlegend_donations
CREATE TABLE IF NOT EXISTS public.apexlegend_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID REFERENCES public.streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 1 AND amount <= 100000),
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  gif_url TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'auto_approved', 'rejected')),
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: lofibeats_donations
CREATE TABLE IF NOT EXISTS public.lofibeats_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID REFERENCES public.streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 1 AND amount <= 100000),
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  gif_url TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'auto_approved', 'rejected')),
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: yogatime_donations
CREATE TABLE IF NOT EXISTS public.yogatime_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID REFERENCES public.streamers(id),
  order_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 1 AND amount <= 100000),
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  gif_url TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'auto_approved', 'rejected')),
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.valorantpro_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.craftmaster_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apexlegend_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lofibeats_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yogatime_donations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE RLS POLICIES
-- ============================================

-- valorantpro_donations policies
CREATE POLICY "Public can read approved valorantpro donations"
  ON public.valorantpro_donations FOR SELECT
  TO PUBLIC
  USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE POLICY "Service role full access valorantpro donations"
  ON public.valorantpro_donations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- craftmaster_donations policies
CREATE POLICY "Public can read approved craftmaster donations"
  ON public.craftmaster_donations FOR SELECT
  TO PUBLIC
  USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE POLICY "Service role full access craftmaster donations"
  ON public.craftmaster_donations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- apexlegend_donations policies
CREATE POLICY "Public can read approved apexlegend donations"
  ON public.apexlegend_donations FOR SELECT
  TO PUBLIC
  USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE POLICY "Service role full access apexlegend donations"
  ON public.apexlegend_donations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- lofibeats_donations policies
CREATE POLICY "Public can read approved lofibeats donations"
  ON public.lofibeats_donations FOR SELECT
  TO PUBLIC
  USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE POLICY "Service role full access lofibeats donations"
  ON public.lofibeats_donations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- yogatime_donations policies
CREATE POLICY "Public can read approved yogatime donations"
  ON public.yogatime_donations FOR SELECT
  TO PUBLIC
  USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE POLICY "Service role full access yogatime donations"
  ON public.yogatime_donations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. CREATE AUTO-APPROVE HYPEREMOTE FUNCTIONS & TRIGGERS
-- ============================================

-- valorantpro
CREATE OR REPLACE FUNCTION public.auto_approve_valorantpro_hyperemotes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_auto_approve_valorantpro_hyperemotes
  BEFORE INSERT OR UPDATE ON public.valorantpro_donations
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_valorantpro_hyperemotes();

-- craftmaster
CREATE OR REPLACE FUNCTION public.auto_approve_craftmaster_hyperemotes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_auto_approve_craftmaster_hyperemotes
  BEFORE INSERT OR UPDATE ON public.craftmaster_donations
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_craftmaster_hyperemotes();

-- apexlegend
CREATE OR REPLACE FUNCTION public.auto_approve_apexlegend_hyperemotes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_auto_approve_apexlegend_hyperemotes
  BEFORE INSERT OR UPDATE ON public.apexlegend_donations
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_apexlegend_hyperemotes();

-- lofibeats
CREATE OR REPLACE FUNCTION public.auto_approve_lofibeats_hyperemotes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_auto_approve_lofibeats_hyperemotes
  BEFORE INSERT OR UPDATE ON public.lofibeats_donations
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_lofibeats_hyperemotes();

-- yogatime
CREATE OR REPLACE FUNCTION public.auto_approve_yogatime_hyperemotes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_auto_approve_yogatime_hyperemotes
  BEFORE INSERT OR UPDATE ON public.yogatime_donations
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_yogatime_hyperemotes();

-- ============================================
-- 5. INSERT STREAMER RECORDS
-- ============================================

INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, hyperemotes_enabled, hyperemotes_min_amount)
VALUES 
  ('valorantpro', 'ValorantPro', '#ff4655', true, 50),
  ('craftmaster', 'CraftMaster', '#8B4513', true, 50),
  ('apexlegend', 'ApexLegend', '#e74c3c', true, 50),
  ('lofibeats', 'LofiBeats', '#9b59b6', true, 50),
  ('yogatime', 'YogaTime', '#27ae60', true, 50)
ON CONFLICT (streamer_slug) DO NOTHING;