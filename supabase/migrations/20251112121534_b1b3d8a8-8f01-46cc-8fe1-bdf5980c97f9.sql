-- STEP 1: Rename fitnessflow to sizzors
ALTER TABLE IF EXISTS public.fitnessflow_donations RENAME TO sizzors_donations;

UPDATE public.streamers 
SET streamer_slug = 'sizzors',
    streamer_name = 'Sizzors',
    brand_color = '#8b5cf6'
WHERE streamer_slug = 'fitnessflow';

-- Drop old function and create new one for sizzors
DROP FUNCTION IF EXISTS public.auto_approve_fitnessflow_hyperemotes() CASCADE;

CREATE OR REPLACE FUNCTION public.auto_approve_sizzors_hyperemotes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for sizzors
DROP TRIGGER IF EXISTS auto_approve_sizzors_hyperemotes_trigger ON public.sizzors_donations;
CREATE TRIGGER auto_approve_sizzors_hyperemotes_trigger
  BEFORE INSERT ON public.sizzors_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_sizzors_hyperemotes();

-- STEP 2: Drop all unwanted donation tables (keeping only ankit, chiaa_gaming, looteriya_gaming, sizzors)
DROP TABLE IF EXISTS public.apexlegend_donations CASCADE;
DROP TABLE IF EXISTS public.artcreate_donations CASCADE;
DROP TABLE IF EXISTS public.codelive_donations CASCADE;
DROP TABLE IF EXISTS public.craftmaster_donations CASCADE;
DROP TABLE IF EXISTS public.demo2_donations CASCADE;
DROP TABLE IF EXISTS public.demo3_donations CASCADE;
DROP TABLE IF EXISTS public.demo4_donations CASCADE;
DROP TABLE IF EXISTS public.demostreamer_donations CASCADE;
DROP TABLE IF EXISTS public.lofibeats_donations CASCADE;
DROP TABLE IF EXISTS public.musicstream_donations CASCADE;
DROP TABLE IF EXISTS public.techgamer_donations CASCADE;
DROP TABLE IF EXISTS public.valorantpro_donations CASCADE;
DROP TABLE IF EXISTS public.yogatime_donations CASCADE;
DROP TABLE IF EXISTS public.newstreamer_donations CASCADE;
DROP TABLE IF EXISTS public.chia_gaming_donations CASCADE;

-- Drop streamer17-46 donation tables
DROP TABLE IF EXISTS public.streamer17_donations CASCADE;
DROP TABLE IF EXISTS public.streamer18_donations CASCADE;
DROP TABLE IF EXISTS public.streamer19_donations CASCADE;
DROP TABLE IF EXISTS public.streamer20_donations CASCADE;
DROP TABLE IF EXISTS public.streamer21_donations CASCADE;
DROP TABLE IF EXISTS public.streamer22_donations CASCADE;
DROP TABLE IF EXISTS public.streamer23_donations CASCADE;
DROP TABLE IF EXISTS public.streamer24_donations CASCADE;
DROP TABLE IF EXISTS public.streamer25_donations CASCADE;
DROP TABLE IF EXISTS public.streamer26_donations CASCADE;
DROP TABLE IF EXISTS public.streamer27_donations CASCADE;
DROP TABLE IF EXISTS public.streamer28_donations CASCADE;
DROP TABLE IF EXISTS public.streamer29_donations CASCADE;
DROP TABLE IF EXISTS public.streamer30_donations CASCADE;
DROP TABLE IF EXISTS public.streamer31_donations CASCADE;
DROP TABLE IF EXISTS public.streamer32_donations CASCADE;
DROP TABLE IF EXISTS public.streamer33_donations CASCADE;
DROP TABLE IF EXISTS public.streamer34_donations CASCADE;
DROP TABLE IF EXISTS public.streamer35_donations CASCADE;
DROP TABLE IF EXISTS public.streamer36_donations CASCADE;
DROP TABLE IF EXISTS public.streamer37_donations CASCADE;
DROP TABLE IF EXISTS public.streamer38_donations CASCADE;
DROP TABLE IF EXISTS public.streamer39_donations CASCADE;
DROP TABLE IF EXISTS public.streamer40_donations CASCADE;
DROP TABLE IF EXISTS public.streamer41_donations CASCADE;
DROP TABLE IF EXISTS public.streamer42_donations CASCADE;
DROP TABLE IF EXISTS public.streamer43_donations CASCADE;
DROP TABLE IF EXISTS public.streamer44_donations CASCADE;
DROP TABLE IF EXISTS public.streamer45_donations CASCADE;
DROP TABLE IF EXISTS public.streamer46_donations CASCADE;

-- STEP 3: Drop related auto-approve functions for deleted streamers
DROP FUNCTION IF EXISTS public.auto_approve_apexlegend_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_craftmaster_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_demostreamer_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_lofibeats_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_musicstream_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_newstreamer_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_techgamer_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_valorantpro_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_yogatime_hyperemotes() CASCADE;

-- STEP 4: Clean up streamers table - keep only the 4 active streamers
DELETE FROM public.streamers 
WHERE streamer_slug NOT IN ('ankit', 'chiaa_gaming', 'looteriya_gaming', 'sizzors');