-- Fix critical security vulnerability in user_signups table
-- The current policies are broken and potentially expose customer data

-- Drop ALL existing policies to start clean
DROP POLICY IF EXISTS "Allow inserts for everyone" ON public.user_signups;
DROP POLICY IF EXISTS "Allow users to view own submissions" ON public.user_signups;  
DROP POLICY IF EXISTS "Public can insert user signups" ON public.user_signups;

-- Create a secure write-only policy for anonymous signups
-- This allows the signup form to work but prevents any unauthorized data access
CREATE POLICY "Allow anonymous signups only" 
ON public.user_signups 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Optional: Add admin-only read access (uncomment if you need it)
-- First you would need to create an admin role system
-- CREATE POLICY "Admin only read access" 
-- ON public.user_signups 
-- FOR SELECT 
-- USING (public.is_admin_user());

-- Verify RLS is enabled
ALTER TABLE public.user_signups ENABLE ROW LEVEL SECURITY;