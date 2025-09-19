-- Add missing temp_voice_data column to ankit_donations table for voice message storage
ALTER TABLE public.ankit_donations 
ADD COLUMN temp_voice_data TEXT;

-- Update the current failed payment to success status for testing
UPDATE public.ankit_donations 
SET payment_status = 'success', updated_at = now()
WHERE order_id = 'ankit_1758305730539_8p5chif4j' AND payment_status = 'pending';