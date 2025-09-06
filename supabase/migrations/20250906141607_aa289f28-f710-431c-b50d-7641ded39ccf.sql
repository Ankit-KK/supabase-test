-- Create admin_emails table to store authorized admin email addresses
CREATE TABLE public.admin_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin access to admin_emails table
CREATE POLICY "Admins can manage admin emails" 
ON public.admin_emails 
FOR ALL 
USING (auth.email() IN (SELECT email FROM public.admin_emails))
WITH CHECK (auth.email() IN (SELECT email FROM public.admin_emails));

-- Create function to check if an email is an admin email
CREATE OR REPLACE FUNCTION public.is_admin_email(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails 
    WHERE email = check_email
  );
$$;

-- Create function to get streamers accessible by admin
CREATE OR REPLACE FUNCTION public.get_admin_streamers(admin_email text)
RETURNS TABLE(id uuid, streamer_slug text, streamer_name text, brand_color text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.id, s.streamer_slug, s.streamer_name, s.brand_color
  FROM public.streamers s
  WHERE public.is_admin_email(admin_email);
$$;

-- Insert a placeholder admin email (you can update this later)
INSERT INTO public.admin_emails (email) VALUES ('admin@hyperchat.space');