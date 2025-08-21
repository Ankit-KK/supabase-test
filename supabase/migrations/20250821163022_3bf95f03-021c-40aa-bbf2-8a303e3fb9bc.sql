-- Enable required extensions (idempotent)
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Remove existing job with same name if present
select cron.unschedule(jobid)
from cron.job
where jobname = 'verify-pending-payments-every-10-min';

-- Schedule the verify-pending-payments function every 10 minutes
select
  cron.schedule(
    'verify-pending-payments-every-10-min',
    '*/10 * * * *',
    $$
    select net.http_post(
      url := 'https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/verify-pending-payments',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzZXZzanZ0cnNoZ2VpdWRybnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1ODE1ODEsImV4cCI6MjA1ODE1NzU4MX0.uLkTc3a0kdMNfgIg2qYKnnaLjbvtXGKPOoWbqntibmw"}'::jsonb,
      body := '{}'::jsonb
    );
    $$
  );