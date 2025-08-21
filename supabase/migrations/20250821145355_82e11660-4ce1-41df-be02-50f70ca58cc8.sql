-- Enable pg_cron and pg_net extensions for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the payment verification function to run every 30 minutes
SELECT cron.schedule(
  'verify-pending-payments-job',
  '*/30 * * * *', -- every 30 minutes
  $$
  select
    net.http_post(
        url:='https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/verify-pending-payments',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzZXZzanZ0cnNoZ2VpdWRybnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1ODE1ODEsImV4cCI6MjA1ODE1NzU4MX0.uLkTc3a0kdMNfgIg2qYKnnaLjbvtXGKPOoWbqntibmw"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);