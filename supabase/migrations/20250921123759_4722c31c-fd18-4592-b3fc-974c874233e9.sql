-- Phase 1: Database Standardization

-- Create dedicated donation tables for each streamer following ankit_donations schema
CREATE TABLE public.techgamer_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT,
  streamer_id UUID,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  payment_status TEXT DEFAULT 'pending',
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.musicstream_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT,
  streamer_id UUID,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  payment_status TEXT DEFAULT 'pending',
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.fitnessflow_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT,
  streamer_id UUID,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  payment_status TEXT DEFAULT 'pending',
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.techgamer_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.musicstream_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitnessflow_donations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for viewing approved donations (same as ankit_donations)
CREATE POLICY "Anyone can view approved donations" ON public.techgamer_donations
  FOR SELECT USING (
    moderation_status = ANY(ARRAY['approved'::text, 'auto_approved'::text]) 
    AND payment_status = 'success'::text
  );

CREATE POLICY "Anyone can view approved donations" ON public.musicstream_donations
  FOR SELECT USING (
    moderation_status = ANY(ARRAY['approved'::text, 'auto_approved'::text]) 
    AND payment_status = 'success'::text
  );

CREATE POLICY "Anyone can view approved donations" ON public.fitnessflow_donations
  FOR SELECT USING (
    moderation_status = ANY(ARRAY['approved'::text, 'auto_approved'::text]) 
    AND payment_status = 'success'::text
  );

-- Create or update streamer records for missing streamers
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, hyperemotes_enabled, hyperemotes_min_amount)
VALUES 
  ('techgamer', 'TechGamer', '#10b981', true, 50),
  ('musicstream', 'MusicStream', '#8b5cf6', true, 50),
  ('fitnessflow', 'FitnessFlow', '#f59e0b', true, 50)
ON CONFLICT (streamer_slug) DO UPDATE SET
  streamer_name = EXCLUDED.streamer_name,
  brand_color = EXCLUDED.brand_color,
  hyperemotes_enabled = EXCLUDED.hyperemotes_enabled,
  hyperemotes_min_amount = EXCLUDED.hyperemotes_min_amount;

-- Update existing streamers to ensure proper configuration
UPDATE public.streamers SET
  streamer_name = 'CodeLive',
  brand_color = '#ef4444',
  hyperemotes_enabled = true,
  hyperemotes_min_amount = 50
WHERE streamer_slug = 'codelive';

UPDATE public.streamers SET
  streamer_name = 'ArtCreate',
  brand_color = '#ec4899',
  hyperemotes_enabled = true,
  hyperemotes_min_amount = 50
WHERE streamer_slug = 'artcreate';

-- Create auto-approval triggers for hyperemotes on new tables
CREATE OR REPLACE FUNCTION public.auto_approve_techgamer_hyperemotes()
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

CREATE OR REPLACE FUNCTION public.auto_approve_musicstream_hyperemotes()
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

CREATE OR REPLACE FUNCTION public.auto_approve_fitnessflow_hyperemotes()
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

-- Create triggers for auto-approval
CREATE TRIGGER auto_approve_techgamer_hyperemotes_trigger
  BEFORE INSERT ON public.techgamer_donations
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_techgamer_hyperemotes();

CREATE TRIGGER auto_approve_musicstream_hyperemotes_trigger
  BEFORE INSERT ON public.musicstream_donations
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_musicstream_hyperemotes();

CREATE TRIGGER auto_approve_fitnessflow_hyperemotes_trigger
  BEFORE INSERT ON public.fitnessflow_donations
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_fitnessflow_hyperemotes();