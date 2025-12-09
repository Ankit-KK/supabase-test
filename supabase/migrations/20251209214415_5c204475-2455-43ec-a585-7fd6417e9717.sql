-- Add currency column to ankit_donations table for international payments
ALTER TABLE ankit_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR' NOT NULL;