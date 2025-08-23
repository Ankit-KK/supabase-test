-- Ensure hyperemote auto-approval trigger exists
DROP TRIGGER IF EXISTS auto_approve_hyperemotes_trigger ON public.chia_gaming_donations;
CREATE TRIGGER auto_approve_hyperemotes_trigger
  BEFORE INSERT ON public.chia_gaming_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_hyperemotes();

-- Ensure realtime captures full row changes
ALTER TABLE public.chia_gaming_donations REPLICA IDENTITY FULL;

-- Backfill: auto-approve existing pending hyperemote donations
UPDATE public.chia_gaming_donations
SET moderation_status = 'auto_approved', approved_by = 'system', approved_at = now()
WHERE is_hyperemote = true AND (moderation_status IS NULL OR moderation_status = 'pending');