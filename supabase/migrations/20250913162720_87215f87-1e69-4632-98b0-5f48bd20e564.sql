-- Enable real-time updates for donation tables
ALTER TABLE public.ankit_donations REPLICA IDENTITY FULL;
ALTER TABLE public.chia_gaming_donations REPLICA IDENTITY FULL;
ALTER TABLE public.demostreamer_donations REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ankit_donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chia_gaming_donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.demostreamer_donations;