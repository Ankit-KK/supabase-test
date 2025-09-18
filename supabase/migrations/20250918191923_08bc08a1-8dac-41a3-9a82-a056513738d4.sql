-- Drop existing function that conflicts
DROP FUNCTION IF EXISTS public.get_streamer_by_slug(text) CASCADE;

-- Complete Database Recreation: Tables + Functions
-- Step 1: Create all necessary tables first

-- Create streamers table
CREATE TABLE IF NOT EXISTS public.streamers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  streamer_slug text UNIQUE NOT NULL,
  streamer_name text NOT NULL,
  brand_color text DEFAULT '#3b82f6',
  brand_logo_url text,
  hyperemotes_enabled boolean DEFAULT true,
  hyperemotes_min_amount numeric DEFAULT 50,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create obs_tokens table
CREATE TABLE IF NOT EXISTS public.obs_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id uuid REFERENCES public.streamers(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create donation tables for each streamer
CREATE TABLE IF NOT EXISTS public.ankit_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id uuid REFERENCES public.streamers(id) ON DELETE SET NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  message text,
  voice_message_url text,
  payment_status text DEFAULT 'pending',
  moderation_status text DEFAULT 'pending',
  is_hyperemote boolean DEFAULT false,
  approved_by text,
  approved_at timestamp with time zone,
  message_visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chia_gaming_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id uuid REFERENCES public.streamers(id) ON DELETE SET NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  message text,
  voice_message_url text,
  payment_status text DEFAULT 'pending',
  moderation_status text DEFAULT 'pending',
  is_hyperemote boolean DEFAULT false,
  approved_by text,
  approved_at timestamp with time zone,
  message_visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.demostreamer_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id uuid REFERENCES public.streamers(id) ON DELETE SET NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  message text,
  voice_message_url text,
  payment_status text DEFAULT 'pending',
  moderation_status text DEFAULT 'pending',
  is_hyperemote boolean DEFAULT false,
  approved_by text,
  approved_at timestamp with time zone,
  message_visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.streamers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obs_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ankit_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chia_gaming_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demostreamer_donations ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for streamers (public read)
CREATE POLICY "Anyone can view streamers" ON public.streamers
FOR SELECT USING (true);

-- Basic RLS policies for donations (public read for approved donations)
CREATE POLICY "Anyone can view approved donations" ON public.ankit_donations
FOR SELECT USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE POLICY "Anyone can view approved donations" ON public.chia_gaming_donations
FOR SELECT USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE POLICY "Anyone can view approved donations" ON public.demostreamer_donations
FOR SELECT USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

-- Step 2: Create essential functions

-- 1. Security Functions
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IN (
    SELECT NULL::uuid WHERE FALSE  -- Restrictive by default
  );
$$;

CREATE OR REPLACE FUNCTION public.validate_donation_input(
  p_amount numeric,
  p_name text,
  p_message text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate amount
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000 THEN
    RETURN false;
  END IF;
  
  -- Validate name
  IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 OR LENGTH(p_name) > 100 THEN
    RETURN false;
  END IF;
  
  -- Validate message if provided
  IF p_message IS NOT NULL AND LENGTH(p_message) > 500 THEN
    RETURN false;
  END IF;
  
  -- Check for XSS attempts
  IF p_name ~* '<[^>]*>|javascript:|data:|vbscript:' OR 
     (p_message IS NOT NULL AND p_message ~* '<[^>]*>|javascript:|data:|vbscript:') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 2. Streamer Management Functions
CREATE OR REPLACE FUNCTION public.get_streamer_by_slug(slug text)
RETURNS TABLE(
  id uuid,
  streamer_slug text,
  streamer_name text,
  brand_color text,
  brand_logo_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    s.brand_logo_url
  FROM public.streamers s
  WHERE s.streamer_slug = slug
  LIMIT 1;
$$;

-- 3. OBS Token Functions
CREATE OR REPLACE FUNCTION public.generate_obs_token(p_streamer_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token text;
BEGIN
  -- Generate cryptographically secure token
  new_token := encode(gen_random_bytes(32), 'hex');
  
  -- Deactivate existing tokens
  UPDATE public.obs_tokens
  SET is_active = false
  WHERE streamer_id = p_streamer_id AND is_active = true;
  
  -- Insert new token
  INSERT INTO public.obs_tokens (streamer_id, token, is_active)
  VALUES (p_streamer_id, new_token, true);
  
  RETURN new_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_obs_token(token_to_check text)
RETURNS TABLE(
  streamer_id uuid,
  streamer_slug text,
  streamer_name text,
  brand_color text,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as streamer_id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    true as is_valid
  FROM public.streamers s
  INNER JOIN public.obs_tokens ot ON s.id = ot.streamer_id
  WHERE ot.token = token_to_check 
    AND ot.is_active = true
    AND (ot.expires_at IS NULL OR ot.expires_at > now());
    
  -- If no valid token found, return invalid result
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      NULL::uuid as streamer_id,
      NULL::text as streamer_slug,
      NULL::text as streamer_name,
      NULL::text as brand_color,
      false as is_valid;
  END IF;
END;
$$;

-- 4. Auto-approval Triggers for Hyperemotes
CREATE OR REPLACE FUNCTION public.auto_approve_hyperemotes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-approve hyperemotes
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for auto-approval
DROP TRIGGER IF EXISTS auto_approve_ankit_hyperemotes ON public.ankit_donations;
CREATE TRIGGER auto_approve_ankit_hyperemotes
  BEFORE INSERT OR UPDATE ON public.ankit_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_hyperemotes();

DROP TRIGGER IF EXISTS auto_approve_chia_gaming_hyperemotes ON public.chia_gaming_donations;
CREATE TRIGGER auto_approve_chia_gaming_hyperemotes
  BEFORE INSERT OR UPDATE ON public.chia_gaming_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_hyperemotes();

DROP TRIGGER IF EXISTS auto_approve_demostreamer_hyperemotes ON public.demostreamer_donations;
CREATE TRIGGER auto_approve_demostreamer_hyperemotes
  BEFORE INSERT OR UPDATE ON public.demostreamer_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_hyperemotes();

-- Create updated_at triggers
DROP TRIGGER IF EXISTS update_streamers_updated_at ON public.streamers;
CREATE TRIGGER update_streamers_updated_at
  BEFORE UPDATE ON public.streamers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_obs_tokens_updated_at ON public.obs_tokens;
CREATE TRIGGER update_obs_tokens_updated_at
  BEFORE UPDATE ON public.obs_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default streamers
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color) VALUES
('ankit', 'Ankit', '#3b82f6'),
('chia_gaming', 'Chia Gaming', '#ec4899'),
('demostreamer', 'Demo Streamer', '#6366f1')
ON CONFLICT (streamer_slug) DO NOTHING;