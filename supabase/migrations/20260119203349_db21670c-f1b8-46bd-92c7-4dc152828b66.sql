-- Unschedule orphaned cron jobs that are calling non-existent or broken functions
-- This cleans up the verify-pending-payments cron job that's causing 500 errors

-- First, list and remove any cron jobs related to verify-pending-payments
SELECT cron.unschedule('verify-pending-payments-every-10-min');

-- Also try alternate naming patterns that might exist
DO $$
BEGIN
  -- Try to unschedule with various possible names
  PERFORM cron.unschedule('verify-pending-payments-job');
EXCEPTION WHEN OTHERS THEN
  -- Ignore if job doesn't exist
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('verify-pending-payments');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;