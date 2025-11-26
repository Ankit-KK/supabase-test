-- Add razorpay_order_id column to Looteriya Gaming, Damask Plays, and Neko Xenpai donation tables
ALTER TABLE looteriya_gaming_donations ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE damask_plays_donations ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE neko_xenpai_donations ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;