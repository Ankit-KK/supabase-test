-- Add verification tracking fields to chiaa_gaming_donations table
ALTER TABLE public.chiaa_gaming_donations 
ADD COLUMN verification_attempts integer DEFAULT 0,
ADD COLUMN last_verification_at timestamp with time zone,
ADD COLUMN payment_session_id text,
ADD COLUMN cashfree_order_data jsonb,
ADD COLUMN auto_verification_enabled boolean DEFAULT true;

-- Create index for efficient querying of pending payments
CREATE INDEX idx_chiaa_gaming_donations_verification 
ON public.chiaa_gaming_donations (payment_status, verification_attempts, last_verification_at)
WHERE auto_verification_enabled = true;