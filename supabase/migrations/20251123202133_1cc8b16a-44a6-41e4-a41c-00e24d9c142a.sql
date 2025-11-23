-- Add razorpay_order_id column to ankit_donations table for webhook matching
ALTER TABLE ankit_donations 
ADD COLUMN razorpay_order_id TEXT;