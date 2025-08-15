-- Enable realtime for chia_gaming_donations table
ALTER TABLE public.chia_gaming_donations REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chia_gaming_donations;