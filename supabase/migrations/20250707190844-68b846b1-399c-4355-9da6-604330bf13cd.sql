-- Add review status and reviewed timestamp to chiaa_gaming_donations
ALTER TABLE public.chiaa_gaming_donations 
ADD COLUMN review_status TEXT DEFAULT 'pending',
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reviewed_by TEXT;

-- Create index for faster queries
CREATE INDEX idx_chiaa_gaming_donations_review_status ON public.chiaa_gaming_donations(review_status);

-- Custom sound alerts and hyperemotes are auto-approved
UPDATE public.chiaa_gaming_donations 
SET review_status = 'approved', reviewed_at = now(), reviewed_by = 'system'
WHERE (custom_sound_url IS NOT NULL OR hyperemotes_enabled = true OR include_sound = true)
AND payment_status = 'success';