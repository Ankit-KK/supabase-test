-- Create abdevil-gifs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('abdevil-gifs', 'abdevil-gifs', true);

-- Allow public read access for abdevil-gifs
CREATE POLICY "Allow public read access for abdevil-gifs"
ON storage.objects FOR SELECT
USING (bucket_id = 'abdevil-gifs');

-- Allow service role full access for abdevil-gifs
CREATE POLICY "Allow service role full access for abdevil-gifs"
ON storage.objects FOR ALL
USING (bucket_id = 'abdevil-gifs' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'abdevil-gifs' AND auth.role() = 'service_role');