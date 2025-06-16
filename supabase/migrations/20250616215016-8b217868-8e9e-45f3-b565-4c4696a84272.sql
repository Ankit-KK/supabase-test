
-- Create storage bucket for custom sound alerts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-sounds',
  'custom-sounds', 
  true,
  5242880, -- 5MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
);

-- Create RLS policies for the custom sounds bucket
CREATE POLICY "Public read access for custom sounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'custom-sounds');

CREATE POLICY "Public insert access for custom sounds"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'custom-sounds');

CREATE POLICY "Public update access for custom sounds"
ON storage.objects FOR UPDATE
USING (bucket_id = 'custom-sounds');

CREATE POLICY "Public delete access for custom sounds"
ON storage.objects FOR DELETE
USING (bucket_id = 'custom-sounds');

-- Insert the custom sound alerts into the storage bucket
-- Note: You'll need to upload the actual files to storage first, then insert these records
-- For now, I'll create the structure to reference external URLs

-- Create a table to store custom sound definitions
CREATE TABLE public.custom_sound_alerts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on custom sound alerts
ALTER TABLE public.custom_sound_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to custom sound alerts
CREATE POLICY "Public read access for custom sound alerts"
ON public.custom_sound_alerts FOR SELECT
USING (true);

-- Insert the custom sound alerts with your provided URLs
INSERT INTO public.custom_sound_alerts (id, name, file_url) VALUES
('knock_left', 'Knock left', 'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/knock-left-ear-made-with-Voicemod.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNjE0Mzg4Ni1lZTVhLTQxZGYtYWZmMC0xNDZiYjJlYWRjYTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhbmtpdC9rbm9jay1sZWZ0LWVhci1tYWRlLXdpdGgtVm9pY2Vtb2QubXAzIiwiaWF0IjoxNzUwMTAyMjY1LCJleHAiOjE3ODE2MzgyNjV9.DcGT2DWtGaHhBXp_2wMRZqUf1CbU20c0qYjc6KSrd8w'),
('raze_ult', 'Raze ult', 'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/raze-fire-in-the-hole.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNjE0Mzg4Ni1lZTVhLTQxZGYtYWZmMC0xNDZiYjJlYWRjYTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhbmtpdC9yYXplLWZpcmUtaW4tdGhlLWhvbGUubXAzIiwiaWF0IjoxNzUwMTAyMjg0LCJleHAiOjE3ODE2MzgyODR9.OCq6GIUUZnrv7XwELWUd061_mkukaPswNEWfa8Ym-nk'),
('sova_ult', 'Sova ult', 'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/valorant-sova-made-with-Voicemod.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNjE0Mzg4Ni1lZTVhLTQxZGYtYWZmMC0xNDZiYjJlYWRjYTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhbmtpdC92YWxvcmFudC1zb3ZhLW1hZGUtd2l0aC1Wb2ljZW1vZC5tcDMiLCJpYXQiOjE3NTAxMDIzMDQsImV4cCI6MTc4MTYzODMwNH0.jO6w7EOQX26Grqam2DvKylzCLQNqbfEKtKyvjPkEu2Q'),
('spike_plant', 'Spike plant', 'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/valorant-spike-plant.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNjE0Mzg4Ni1lZTVhLTQxZGYtYWZmMC0xNDZiYjJlYWRjYTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhbmtpdC92YWxvcmFudC1zcGlrZS1wbGFudC5tcDMiLCJpYXQiOjE3NTAxMDIzMTYsImV4cCI6MTc4MTYzODMxNn0.LiWtdJaD5FeJNRWiQaYvADesOo7sXhcg_MZbpRT1gHg');
