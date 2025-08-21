-- Add columns for better payment tracking
ALTER TABLE public.chia_gaming_donations 
ADD COLUMN IF NOT EXISTS cashfree_order_id text,
ADD COLUMN IF NOT EXISTS last_verification_attempt timestamp with time zone,
ADD COLUMN IF NOT EXISTS auto_verified boolean DEFAULT false;

-- Create index for efficient pending payment queries
CREATE INDEX IF NOT EXISTS idx_pending_donations_for_verification 
ON public.chia_gaming_donations (payment_status, created_at, last_verification_attempt) 
WHERE payment_status = 'pending';

-- Create index for cashfree order ID lookups
CREATE INDEX IF NOT EXISTS idx_cashfree_order_id 
ON public.chia_gaming_donations (cashfree_order_id);