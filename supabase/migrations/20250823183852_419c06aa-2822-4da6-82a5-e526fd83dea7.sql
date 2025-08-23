-- Ensure realtime is enabled for chia_gaming_donations
-- Set REPLICA IDENTITY to FULL for complete row data on updates
ALTER TABLE IF EXISTS public.chia_gaming_donations REPLICA IDENTITY FULL;

-- Add table to supabase_realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chia_gaming_donations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chia_gaming_donations;
  END IF;
END $$;
