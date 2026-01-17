-- Fix user_signups table RLS policies to properly restrict access
-- The service role policies using current_setting() are not the correct pattern
-- Replace with proper TO service_role policies

-- Drop the problematic service role policies
DROP POLICY IF EXISTS "Service role can manage user signups" ON public.user_signups;
DROP POLICY IF EXISTS "Service role can read user signups" ON public.user_signups;

-- Create proper service role policy
CREATE POLICY "Service role full access"
ON public.user_signups
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify the deny policies exist for anon/authenticated (they already exist but let's ensure they're correct)
-- These already correctly block SELECT, UPDATE, DELETE with qual: false

-- The INSERT policy allows anonymous signups with validation which is correct for a signup form
-- Keep that policy as-is since users need to be able to sign up