-- Set up cron job to run payment status updater every 5 minutes
-- First, ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the payment status updater to run every 5 minutes
SELECT cron.schedule(
  'chiaa-gaming-payment-verification',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/payment-status-updater',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:=concat('{"trigger": "cron", "timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);