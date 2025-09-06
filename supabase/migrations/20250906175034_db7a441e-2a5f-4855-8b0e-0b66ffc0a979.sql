-- Add admin access policies to donation tables
-- Admins can view all ankit donations
CREATE POLICY "Admins can view all ankit donations" 
ON public.ankit_donations 
FOR SELECT 
USING (public.is_admin_email(auth.email()));

-- Admins can manage all ankit donations
CREATE POLICY "Admins can manage all ankit donations" 
ON public.ankit_donations 
FOR ALL 
USING (public.is_admin_email(auth.email()))
WITH CHECK (public.is_admin_email(auth.email()));

-- Admins can view all chia gaming donations
CREATE POLICY "Admins can view all chia gaming donations" 
ON public.chia_gaming_donations 
FOR SELECT 
USING (public.is_admin_email(auth.email()));

-- Admins can manage all chia gaming donations
CREATE POLICY "Admins can manage all chia gaming donations" 
ON public.chia_gaming_donations 
FOR ALL 
USING (public.is_admin_email(auth.email()))
WITH CHECK (public.is_admin_email(auth.email()));

-- Admins can view all newstreamer donations
CREATE POLICY "Admins can view all newstreamer donations" 
ON public.newstreamer_donations 
FOR SELECT 
USING (public.is_admin_email(auth.email()));

-- Admins can manage all newstreamer donations
CREATE POLICY "Admins can manage all newstreamer donations" 
ON public.newstreamer_donations 
FOR ALL 
USING (public.is_admin_email(auth.email()))
WITH CHECK (public.is_admin_email(auth.email()));

-- Admins can view all streamers
CREATE POLICY "Admins can view all streamers" 
ON public.streamers 
FOR SELECT 
USING (public.is_admin_email(auth.email()));

-- Admins can manage all streamers  
CREATE POLICY "Admins can manage all streamers" 
ON public.streamers 
FOR ALL 
USING (public.is_admin_email(auth.email()))
WITH CHECK (public.is_admin_email(auth.email()));

-- Admins can view all moderators
CREATE POLICY "Admins can view all moderators" 
ON public.streamers_moderators 
FOR SELECT 
USING (public.is_admin_email(auth.email()));

-- Admins can manage all moderators
CREATE POLICY "Admins can manage all moderators" 
ON public.streamers_moderators 
FOR ALL 
USING (public.is_admin_email(auth.email()))
WITH CHECK (public.is_admin_email(auth.email()));