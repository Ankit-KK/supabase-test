-- Create storage bucket for BongFlick GIFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('bongflick-gifs', 'bongflick-gifs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to view GIFs in the bucket
CREATE POLICY "Public can view BongFlick GIFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'bongflick-gifs');

-- Allow authenticated users to upload GIFs
CREATE POLICY "Authenticated users can upload BongFlick GIFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bongflick-gifs' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete GIFs
CREATE POLICY "Authenticated users can delete BongFlick GIFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'bongflick-gifs' AND auth.role() = 'authenticated');