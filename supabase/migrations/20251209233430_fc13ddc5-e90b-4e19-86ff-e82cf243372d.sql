-- Allow anyone to view/list hypersounds files
CREATE POLICY "Public can view hypersounds"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'hypersounds');