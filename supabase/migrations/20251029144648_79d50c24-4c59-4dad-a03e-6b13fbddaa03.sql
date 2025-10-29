-- Add mod_notified column to all donation tables
-- This tracks whether Telegram moderators have been notified about each donation

ALTER TABLE public.ankit_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chiaa_gaming_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.valorantpro_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.craftmaster_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.apexlegend_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.lofibeats_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.yogatime_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.musicstream_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.techgamer_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.fitnessflow_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.artcreate_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.codelive_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.demostreamer_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.demo2_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.demo3_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.demo4_donations 
ADD COLUMN IF NOT EXISTS mod_notified BOOLEAN DEFAULT FALSE;

-- Create index for faster querying of unnotified donations
CREATE INDEX IF NOT EXISTS idx_ankit_donations_mod_notified ON public.ankit_donations(mod_notified, payment_status) WHERE mod_notified = FALSE AND payment_status = 'success';
CREATE INDEX IF NOT EXISTS idx_chiaa_gaming_donations_mod_notified ON public.chiaa_gaming_donations(mod_notified, payment_status) WHERE mod_notified = FALSE AND payment_status = 'success';
CREATE INDEX IF NOT EXISTS idx_valorantpro_donations_mod_notified ON public.valorantpro_donations(mod_notified, payment_status) WHERE mod_notified = FALSE AND payment_status = 'success';
CREATE INDEX IF NOT EXISTS idx_craftmaster_donations_mod_notified ON public.craftmaster_donations(mod_notified, payment_status) WHERE mod_notified = FALSE AND payment_status = 'success';
CREATE INDEX IF NOT EXISTS idx_apexlegend_donations_mod_notified ON public.apexlegend_donations(mod_notified, payment_status) WHERE mod_notified = FALSE AND payment_status = 'success';
CREATE INDEX IF NOT EXISTS idx_lofibeats_donations_mod_notified ON public.lofibeats_donations(mod_notified, payment_status) WHERE mod_notified = FALSE AND payment_status = 'success';
CREATE INDEX IF NOT EXISTS idx_yogatime_donations_mod_notified ON public.yogatime_donations(mod_notified, payment_status) WHERE mod_notified = FALSE AND payment_status = 'success';