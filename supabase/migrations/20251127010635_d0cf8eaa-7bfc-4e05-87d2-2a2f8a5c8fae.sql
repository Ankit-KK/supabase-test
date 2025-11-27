-- Update existing Damask Plays donations with successful payments to auto-approved
UPDATE damask_plays_donations 
SET moderation_status = 'auto_approved', 
    approved_by = 'system', 
    approved_at = NOW(),
    updated_at = NOW()
WHERE payment_status = 'success' 
AND (moderation_status = 'pending' OR moderation_status IS NULL);