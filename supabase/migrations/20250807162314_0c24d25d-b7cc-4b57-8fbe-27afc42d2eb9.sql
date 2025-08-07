-- Check if the function exists first
SELECT proname FROM pg_proc WHERE proname = 'notify_telegram_new_donation';