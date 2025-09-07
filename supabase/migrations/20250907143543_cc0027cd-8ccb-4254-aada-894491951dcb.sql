-- Add partial unique constraints on order_id to prevent duplicates
-- This prevents race conditions during payment processing

-- Add unique constraint for chia_gaming_donations order_id (where not null)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_chia_gaming_donations_order_id_unique 
ON chia_gaming_donations (order_id) 
WHERE order_id IS NOT NULL;

-- Add unique constraint for ankit_donations order_id (where not null)  
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_ankit_donations_order_id_unique 
ON ankit_donations (order_id) 
WHERE order_id IS NOT NULL;

-- Add unique constraint for newstreamer_donations order_id (where not null)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_newstreamer_donations_order_id_unique 
ON newstreamer_donations (order_id) 
WHERE order_id IS NOT NULL;