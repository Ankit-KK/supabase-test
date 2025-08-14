-- Complete cleanup of Ankit and Chiaa Gaming data

-- 1. Drop all donation records first (to avoid foreign key constraints)
DELETE FROM public.ankit_donations;
DELETE FROM public.chiaa_gaming_donations;

-- 2. Clean up related data in other tables
DELETE FROM public.admin_users WHERE admin_type IN ('ankit', 'chiaa_gaming');
DELETE FROM public.moderators WHERE streamer_id IN ('ankit', 'chiaa_gaming');
DELETE FROM public.obs_access_tokens WHERE admin_type IN ('ankit', 'chiaa_gaming');
DELETE FROM public.streamer_contracts WHERE streamer_type IN ('ankit', 'chiaa_gaming');
DELETE FROM public.donation_gifs WHERE donation_id IN (
    SELECT id FROM public.ankit_donations 
    UNION 
    SELECT id FROM public.chiaa_gaming_donations
);

-- 3. Drop the tables completely
DROP TABLE IF EXISTS public.ankit_donations CASCADE;
DROP TABLE IF EXISTS public.chiaa_gaming_donations CASCADE;

-- 4. Drop Chiaa Gaming specific function
DROP FUNCTION IF EXISTS public.can_access_chiaa_gaming_data() CASCADE;

-- 5. Clean up storage buckets (this will be done manually in Supabase dashboard)
-- Note: ankit and chiaa-emotes buckets need to be deleted manually

-- 6. Clean up any remaining policies that might reference these tables
-- (CASCADE should handle this, but ensuring cleanup)