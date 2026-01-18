UPDATE looteriya_gaming_donations
SET 
  payment_status = 'success',
  moderation_status = 'auto_approved',
  approved_at = NOW(),
  approved_by = 'system',
  audio_scheduled_at = NOW()
WHERE order_id = 'lg_rp_1768694085455_qlfrg1vyps' 
  AND payment_status = 'pending';