
-- Create the donation-gifs storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donation-gifs',
  'donation-gifs', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/gif', 'audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for public access
CREATE POLICY "Public read access for donation GIFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'donation-gifs');

CREATE POLICY "Public upload for donation GIFs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'donation-gifs');

CREATE POLICY "Public delete for donation GIFs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'donation-gifs');
