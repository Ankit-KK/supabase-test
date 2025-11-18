-- Allow public to read/list GIFs from looteriya-gifs bucket
CREATE POLICY "Public read access for looteriya GIFs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'looteriya-gifs');

-- Allow public to upload GIFs to looteriya-gifs bucket (for management)
CREATE POLICY "Public upload for looteriya GIFs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'looteriya-gifs');

-- Allow public to delete GIFs from looteriya-gifs bucket (for management)
CREATE POLICY "Public delete for looteriya GIFs"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'looteriya-gifs');