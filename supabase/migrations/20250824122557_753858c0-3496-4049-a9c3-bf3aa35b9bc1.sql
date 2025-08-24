-- Fix security vulnerability in user_signups table
-- Remove broken and duplicate policies
DROP POLICY IF EXISTS "Allow users to view own submissions" ON public.user_signups;
DROP POLICY IF EXISTS "Public can insert user signups" ON public.user_signups;

-- Keep only the secure insert policy for anonymous signups
-- This allows the signup form to work but prevents data theft

-- Optionally add admin-only read access (uncomment if you need admin access)
-- You would need to implement a user roles system first
-- CREATE POLICY "Admin only read access" ON public.user_signups
-- FOR SELECT USING (
--   EXISTS (
--     SELECT 1 FROM public.user_roles 
--     WHERE user_id = auth.uid() AND role = 'admin'
--   )
-- );