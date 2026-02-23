

# Fix: Create the `notify-new-donations` Cron Job

## Root Cause
The `notify-new-donations` edge function exists and works correctly, but **there is no cron job configured** to call it periodically. After the previous fix skipped inline notifications for auto-approved donations (to preserve the surprise element), those donations now rely entirely on the cron -- which doesn't exist.

The latest test donation (Ankit Kumar, INR 2000) confirms this: `mod_notified = false`, `audio_scheduled_at` has passed, but no notification was ever sent.

## Fix

### Step 1: Create the cron job via SQL
Register a `pg_cron` + `pg_net` job that calls the `notify-new-donations` edge function every minute:

```text
SELECT cron.schedule(
  'notify-new-donations-cron',
  '* * * * *',
  -- HTTP POST to the edge function every minute
  net.http_post(
    url := 'https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/notify-new-donations',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := '{"time":"now"}'::jsonb
  )
);
```

### Step 2: Verify the stuck donation gets notified
After the cron is created, the next run (within 1 minute) should pick up the Ankit test donation since:
- `payment_status = 'success'`
- `mod_notified = false`
- `audio_scheduled_at` has already passed

## No Other Changes
- No edge function code changes needed
- No database schema changes
- No frontend changes
- No donation page changes

