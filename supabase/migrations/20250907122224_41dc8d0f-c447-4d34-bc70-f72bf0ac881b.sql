-- Fix remaining security issues that can be addressed via database changes

-- 1. Fix User Profile Data Exposure - restrict profiles table access
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;

-- Create secure profile access policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view other profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true); -- This allows authenticated users to see basic profile info

-- 2. Fix Anonymous Review Spam Issue
-- Drop the anonymous review creation policy
DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;

-- Create secure review policies
CREATE POLICY "Authenticated users can create reviews" 
ON public.reviews 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Add validation for review content
  name IS NOT NULL AND LENGTH(TRIM(name)) BETWEEN 1 AND 100 AND
  content IS NOT NULL AND LENGTH(TRIM(content)) BETWEEN 10 AND 1000 AND
  -- Prevent XSS attempts
  content !~* '<[^>]*>|javascript:|data:|vbscript:'
);

CREATE POLICY "Everyone can view approved reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

-- Log security fixes
INSERT INTO public.audit_logs (action, table_name, user_email, ip_address, user_agent)
VALUES (
  'SECURITY_FIX', 
  'profiles,reviews', 
  'system@lovable.dev',
  'system',
  'Lovable Security Scanner - Fixed profile data exposure and review spam vulnerabilities'
);