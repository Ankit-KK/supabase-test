
-- First, create security definer functions to check user roles and permissions
CREATE OR REPLACE FUNCTION public.get_user_admin_type()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT admin_type 
  FROM public.admin_users 
  WHERE user_email = auth.email()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.admin_users 
    WHERE user_email = auth.email()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_streamer_data(streamer_type TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.admin_users 
    WHERE user_email = auth.email() 
    AND (admin_type = streamer_type OR admin_type = 'admin')
  );
$$;

-- Enable RLS on all tables that don't have it yet
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ankit_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chiaa_gaming_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streamer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_sound_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_gifs ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow public read access to donation_gifs" ON public.donation_gifs;
DROP POLICY IF EXISTS "Allow public insert to donation_gifs" ON public.donation_gifs;
DROP POLICY IF EXISTS "Allow public update to donation_gifs" ON public.donation_gifs;

-- Admin Users Table - Admin access only
CREATE POLICY "Admin users can view admin_users"
  ON public.admin_users
  FOR SELECT
  USING (public.is_admin_user());

CREATE POLICY "Admin users can update admin_users"
  ON public.admin_users
  FOR UPDATE
  USING (public.is_admin_user());

-- User Signups - Admin read, public insert for registration
CREATE POLICY "Public can insert user signups"
  ON public.user_signups
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can view user signups"
  ON public.user_signups
  FOR SELECT
  USING (public.is_admin_user());

CREATE POLICY "Admin can update user signups"
  ON public.user_signups
  FOR UPDATE
  USING (public.is_admin_user());

-- Streamer Contracts - Admin and specific streamer access
CREATE POLICY "Admin can view all contracts"
  ON public.streamer_contracts
  FOR SELECT
  USING (public.is_admin_user());

CREATE POLICY "Streamers can view their contracts"
  ON public.streamer_contracts
  FOR SELECT
  USING (public.can_access_streamer_data(streamer_type));

CREATE POLICY "Admin can insert contracts"
  ON public.streamer_contracts
  FOR INSERT
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admin can update contracts"
  ON public.streamer_contracts
  FOR UPDATE
  USING (public.is_admin_user());

-- Ankit Donations - Public insert (for payment flow), admin/streamer read
CREATE POLICY "Public can insert ankit donations"
  ON public.ankit_donations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can view ankit donations"
  ON public.ankit_donations
  FOR SELECT
  USING (public.is_admin_user());

CREATE POLICY "Ankit can view ankit donations"
  ON public.ankit_donations
  FOR SELECT
  USING (public.can_access_streamer_data('ankit'));

CREATE POLICY "Admin can update ankit donations"
  ON public.ankit_donations
  FOR UPDATE
  USING (public.is_admin_user());

-- Chiaa Gaming Donations - Public insert (for payment flow), admin/streamer read
CREATE POLICY "Public can insert chiaa_gaming donations"
  ON public.chiaa_gaming_donations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can view chiaa_gaming donations"
  ON public.chiaa_gaming_donations
  FOR SELECT
  USING (public.is_admin_user());

CREATE POLICY "Chiaa Gaming can view chiaa_gaming donations"
  ON public.chiaa_gaming_donations
  FOR SELECT
  USING (public.can_access_streamer_data('chiaa_gaming'));

CREATE POLICY "Admin can update chiaa_gaming donations"
  ON public.chiaa_gaming_donations
  FOR UPDATE
  USING (public.is_admin_user());

CREATE POLICY "Chiaa Gaming can update chiaa_gaming donations"
  ON public.chiaa_gaming_donations
  FOR UPDATE
  USING (public.can_access_streamer_data('chiaa_gaming'));

-- Custom Sound Alerts - Admin and streamer access
CREATE POLICY "Admin can manage custom sounds"
  ON public.custom_sound_alerts
  FOR ALL
  USING (public.is_admin_user());

CREATE POLICY "Streamers can view custom sounds"
  ON public.custom_sound_alerts
  FOR SELECT
  USING (auth.email() IS NOT NULL);

-- Donation GIFs - Secure access with time limits
CREATE POLICY "Admin can manage donation gifs"
  ON public.donation_gifs
  FOR ALL
  USING (public.is_admin_user());

CREATE POLICY "Public can insert donation gifs"
  ON public.donation_gifs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Recent donation gifs are viewable"
  ON public.donation_gifs
  FOR SELECT
  USING (
    uploaded_at > NOW() - INTERVAL '24 hours' 
    AND status != 'deleted'
  );

CREATE POLICY "Update recent donation gifs"
  ON public.donation_gifs
  FOR UPDATE
  USING (
    uploaded_at > NOW() - INTERVAL '24 hours'
  );

-- Keep existing policies for other tables that are working correctly
-- (donations, page_visits, profiles, etc. already have appropriate policies or are intentionally public)
