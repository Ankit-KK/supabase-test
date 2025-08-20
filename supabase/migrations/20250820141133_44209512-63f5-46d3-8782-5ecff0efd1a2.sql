-- Add voice message support to chia_gaming_donations table
ALTER TABLE public.chia_gaming_donations 
ADD COLUMN voice_message_url text,
ADD COLUMN voice_duration_seconds integer;

-- Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-messages', 'voice-messages', false);

-- Create storage policies for voice messages
CREATE POLICY "Users can upload voice messages" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'voice-messages');

CREATE POLICY "Public can view voice messages for alerts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'voice-messages');

CREATE POLICY "Users can update their own voice messages" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'voice-messages');

CREATE POLICY "Users can delete their own voice messages" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'voice-messages');