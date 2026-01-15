-- Add razorpay_order_id column to chiaa_gaming_donations table
ALTER TABLE public.chiaa_gaming_donations 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- Create index for efficient webhook lookups
CREATE INDEX IF NOT EXISTS idx_chiaa_gaming_donations_razorpay_order_id 
ON public.chiaa_gaming_donations(razorpay_order_id);