-- Add order_id column to all donation tables to store Cashfree order IDs
ALTER TABLE public.ankit_donations 
ADD COLUMN order_id TEXT;

ALTER TABLE public.chia_gaming_donations 
ADD COLUMN order_id TEXT;

ALTER TABLE public.demostreamer_donations 
ADD COLUMN order_id TEXT;

-- Add indexes for better performance on order_id lookups
CREATE INDEX idx_ankit_donations_order_id ON public.ankit_donations(order_id);
CREATE INDEX idx_chia_gaming_donations_order_id ON public.chia_gaming_donations(order_id);
CREATE INDEX idx_demostreamer_donations_order_id ON public.demostreamer_donations(order_id);