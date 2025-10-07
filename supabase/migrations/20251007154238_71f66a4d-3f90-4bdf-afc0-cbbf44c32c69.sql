-- Create TTS audio storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tts-audio',
  'tts-audio',
  true,
  5242880, -- 5MB limit
  ARRAY['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for TTS audio bucket
CREATE POLICY "Public can read TTS audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tts-audio');

CREATE POLICY "Service role can upload TTS audio"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'tts-audio');

CREATE POLICY "Service role can update TTS audio"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'tts-audio');

CREATE POLICY "Service role can delete TTS audio"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'tts-audio');

-- Add tts_audio_url column to ankit_donations table
ALTER TABLE public.ankit_donations 
ADD COLUMN IF NOT EXISTS tts_audio_url text;