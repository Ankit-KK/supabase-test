-- Insert a test pending donation for manual approval testing
INSERT INTO public.ankit_donations (
  id,
  streamer_id,
  name,
  amount,
  message,
  moderation_status,
  payment_status,
  is_hyperemote,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.streamers WHERE streamer_slug = 'ankit' LIMIT 1),
  'Test Donor',
  100.00,
  'This is a test donation for alert testing - please approve manually!',
  'pending',
  'success',
  false,
  now()
);