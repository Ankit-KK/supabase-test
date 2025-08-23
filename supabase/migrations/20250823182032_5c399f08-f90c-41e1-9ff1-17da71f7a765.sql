-- Check current triggers on chia_gaming_donations table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'chia_gaming_donations';

-- Re-create the auto approval trigger to ensure it's working
DROP TRIGGER IF EXISTS auto_approve_hyperemotes_trigger ON public.chia_gaming_donations;

CREATE TRIGGER auto_approve_hyperemotes_trigger
    BEFORE INSERT ON public.chia_gaming_donations
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_approve_hyperemotes();

-- Enable real-time for donations table
ALTER TABLE public.chia_gaming_donations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chia_gaming_donations;