-- Add moderation columns to existing donations table
ALTER TABLE public.chia_gaming_donations 
ADD COLUMN moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
ADD COLUMN approved_by TEXT,
ADD COLUMN approved_at TIMESTAMPTZ,
ADD COLUMN rejected_reason TEXT;

-- Create moderators table for Telegram bot integration
CREATE TABLE public.streamers_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES public.streamers(id) ON DELETE CASCADE,
  telegram_user_id TEXT UNIQUE,
  mod_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on moderators table
ALTER TABLE public.streamers_moderators ENABLE ROW LEVEL SECURITY;

-- Create policies for moderators table
CREATE POLICY "Streamers can manage their own moderators" 
ON public.streamers_moderators 
FOR ALL 
USING (streamer_id IN (
  SELECT s.id FROM public.streamers s WHERE s.user_id = auth.uid()
));

-- Update existing donations to set hyperemotes as auto-approved
UPDATE public.chia_gaming_donations 
SET moderation_status = 'auto_approved', approved_by = 'system', approved_at = now()
WHERE is_hyperemote = true;

-- Create function to auto-approve hyperemotes on insert
CREATE OR REPLACE FUNCTION public.auto_approve_hyperemotes()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve hyperemotes
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-approval
CREATE TRIGGER trigger_auto_approve_hyperemotes
  BEFORE INSERT ON public.chia_gaming_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_hyperemotes();