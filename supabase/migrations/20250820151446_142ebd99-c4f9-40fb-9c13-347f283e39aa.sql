-- Ensure voice-messages bucket exists and is public
insert into storage.buckets (id, name, public)
values ('voice-messages', 'voice-messages', true)
on conflict (id) do update set public = true;

-- Allow anonymous uploads to voice-messages bucket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Public can upload voice messages'
  ) THEN
    CREATE POLICY "Public can upload voice messages"
    ON storage.objects
    FOR INSERT
    TO anon
    WITH CHECK (bucket_id = 'voice-messages');
  END IF;
END $$;

-- Allow authenticated uploads as well (for dashboard use)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Authenticated can upload voice messages'
  ) THEN
    CREATE POLICY "Authenticated can upload voice messages"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'voice-messages');
  END IF;
END $$;

-- Allow public read access via API (listing/metadata if ever needed)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Public can read voice messages'
  ) THEN
    CREATE POLICY "Public can read voice messages"
    ON storage.objects
    FOR SELECT
    TO anon
    USING (bucket_id = 'voice-messages');
  END IF;
END $$;

-- Allow authenticated read as well
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Authenticated can read voice messages'
  ) THEN
    CREATE POLICY "Authenticated can read voice messages"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'voice-messages');
  END IF;
END $$;