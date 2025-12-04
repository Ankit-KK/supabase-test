-- Add alert_box_scale column to streamers table
ALTER TABLE public.streamers 
ADD COLUMN IF NOT EXISTS alert_box_scale DECIMAL(3,2) DEFAULT 1.0;

-- Add comment for documentation
COMMENT ON COLUMN public.streamers.alert_box_scale IS 'Scale factor for OBS alert box size (0.75=Small, 1.0=Default, 1.25=Large, 1.5=Extra Large)';