-- Drop existing functions that might conflict
DROP FUNCTION IF EXISTS public.add_admin_email(text);
DROP FUNCTION IF EXISTS public.remove_admin_email(text);

-- Create table for streamer email assignments
CREATE TABLE IF NOT EXISTS public.streamers_auth_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID NOT NULL REFERENCES public.streamers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(streamer_id, email)
);

-- Create table for admin emails (if not exists)
CREATE TABLE IF NOT EXISTS public.admin_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.streamers_auth_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for streamers_auth_emails
DROP POLICY IF EXISTS "Only admins can manage streamer emails" ON public.streamers_auth_emails;
CREATE POLICY "Only admins can manage streamer emails" 
ON public.streamers_auth_emails 
FOR ALL 
USING (public.is_admin_email(auth.email()));

-- Create policies for admin_emails  
DROP POLICY IF EXISTS "Only existing admins can manage admin emails" ON public.admin_emails;
CREATE POLICY "Only existing admins can manage admin emails" 
ON public.admin_emails 
FOR ALL 
USING (public.is_admin_email(auth.email()));

-- Function to get streamer by user email
CREATE OR REPLACE FUNCTION public.get_streamer_by_email(user_email text)
RETURNS TABLE(
  streamer_id uuid,
  streamer_slug text,
  streamer_name text,
  brand_color text,
  is_admin boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is admin first
  IF public.is_admin_email(user_email) THEN
    RETURN QUERY
    SELECT NULL::uuid, 'admin'::text, 'Admin Access'::text, '#ef4444'::text, true;
    RETURN;
  END IF;

  -- Find streamer assigned to this email
  RETURN QUERY
  SELECT 
    s.id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    false as is_admin
  FROM public.streamers s
  INNER JOIN public.streamers_auth_emails sae ON s.id = sae.streamer_id
  WHERE lower(sae.email) = lower(user_email)
  LIMIT 1;
END;
$$;

-- Function to assign email to streamer (admin only)
CREATE OR REPLACE FUNCTION public.assign_email_to_streamer(
  p_streamer_slug text,
  p_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_streamer_id uuid;
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin_email(auth.email()) THEN
    RAISE EXCEPTION 'Access denied: Only admins can assign emails to streamers';
  END IF;
  
  -- Get streamer ID
  SELECT id INTO v_streamer_id
  FROM public.streamers
  WHERE streamer_slug = p_streamer_slug;
  
  IF v_streamer_id IS NULL THEN
    RAISE EXCEPTION 'Streamer not found: %', p_streamer_slug;
  END IF;
  
  -- Validate email format
  IF p_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Invalid email format: %', p_email;
  END IF;
  
  -- Insert the assignment (ignore duplicates)
  INSERT INTO public.streamers_auth_emails (streamer_id, email)
  VALUES (v_streamer_id, lower(trim(p_email)))
  ON CONFLICT (streamer_id, email) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Function to remove email assignment (admin only)
CREATE OR REPLACE FUNCTION public.remove_email_from_streamer(
  p_streamer_slug text,
  p_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_streamer_id uuid;
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin_email(auth.email()) THEN
    RAISE EXCEPTION 'Access denied: Only admins can remove email assignments';
  END IF;
  
  -- Get streamer ID
  SELECT id INTO v_streamer_id
  FROM public.streamers
  WHERE streamer_slug = p_streamer_slug;
  
  IF v_streamer_id IS NULL THEN
    RAISE EXCEPTION 'Streamer not found: %', p_streamer_slug;
  END IF;
  
  -- Remove the assignment
  DELETE FROM public.streamers_auth_emails
  WHERE streamer_id = v_streamer_id 
    AND lower(email) = lower(trim(p_email));
  
  RETURN true;
END;
$$;

-- Function to add admin email (admin only)
CREATE OR REPLACE FUNCTION public.add_admin_email(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is admin (allow if no admins exist yet)
  IF EXISTS (SELECT 1 FROM public.admin_emails LIMIT 1) AND 
     NOT public.is_admin_email(auth.email()) THEN
    RAISE EXCEPTION 'Access denied: Only existing admins can add new admin emails';
  END IF;
  
  -- Validate email format
  IF p_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Invalid email format: %', p_email;
  END IF;
  
  -- Insert admin email (ignore duplicates)
  INSERT INTO public.admin_emails (email)
  VALUES (lower(trim(p_email)))
  ON CONFLICT (email) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Insert initial admin email (replace with your actual admin email)
INSERT INTO public.admin_emails (email) VALUES ('admin@example.com') ON CONFLICT DO NOTHING;