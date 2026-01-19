-- Unschedule the payment-status-updater cron job since this function doesn't exist
-- This was scheduled in a previous migration but the function was never created

DO $$
BEGIN
  PERFORM cron.unschedule('payment-status-updater-every-10-min');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('payment-status-updater');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;