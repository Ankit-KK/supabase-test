-- Add razorpay_order_id column to thunderx_donations table
ALTER TABLE thunderx_donations 
ADD COLUMN razorpay_order_id TEXT;