-- Fix security vulnerability: Protect customer contact information in user_signups table

-- Add policy to allow only admins to read customer signup data
CREATE POLICY "Only admins can view user signups" 
ON public.user_signups 
FOR SELECT 
USING (public.is_admin_email(auth.email()));

-- Add policy to allow only admins to manage user signups (update/delete if needed)
CREATE POLICY "Only admins can manage user signups" 
ON public.user_signups 
FOR ALL 
USING (public.is_admin_email(auth.email()))
WITH CHECK (public.is_admin_email(auth.email()));

-- The existing INSERT policy "Allow anonymous signups only" remains unchanged
-- This allows the signup form to work while protecting the data