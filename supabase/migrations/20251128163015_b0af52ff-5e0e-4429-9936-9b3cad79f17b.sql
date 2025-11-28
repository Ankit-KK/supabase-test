-- Fix admin_emails table security by adding restrictive SELECT policy

-- Drop the overly permissive ALL policy
DROP POLICY IF EXISTS "Only existing admins can manage admin emails" ON public.admin_emails;

-- Create separate policies for different operations
-- SELECT: Only existing admins can view the admin email list
CREATE POLICY "Only admins can view admin emails"
ON public.admin_emails
FOR SELECT
USING (public.is_admin_email(auth.email()));

-- INSERT: Only existing admins can add new admin emails
CREATE POLICY "Only admins can add admin emails"
ON public.admin_emails
FOR INSERT
WITH CHECK (public.is_admin_email(auth.email()));

-- UPDATE: Only existing admins can modify admin emails
CREATE POLICY "Only admins can update admin emails"
ON public.admin_emails
FOR UPDATE
USING (public.is_admin_email(auth.email()))
WITH CHECK (public.is_admin_email(auth.email()));

-- DELETE: Only existing admins can remove admin emails
CREATE POLICY "Only admins can delete admin emails"
ON public.admin_emails
FOR DELETE
USING (public.is_admin_email(auth.email()));