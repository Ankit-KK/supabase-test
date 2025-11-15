-- Allow public read access to damask-gif bucket
CREATE POLICY "Public read access for damask GIFs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'damask-gif');

-- Allow public upload to damask-gif bucket (for dashboard)
CREATE POLICY "Public upload for damask GIFs"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'damask-gif');

-- Allow public delete from damask-gif bucket (for dashboard)
CREATE POLICY "Public delete for damask GIFs"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'damask-gif');