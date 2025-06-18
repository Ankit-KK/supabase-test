
-- Update the donation-gifs bucket to allow audio files
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/gif', 'audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg']
WHERE id = 'donation-gifs';

-- Increase file size limit to accommodate audio files (10MB)
UPDATE storage.buckets 
SET file_size_limit = 10485760
WHERE id = 'donation-gifs';
