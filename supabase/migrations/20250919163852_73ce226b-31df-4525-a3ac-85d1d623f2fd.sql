-- Insert comprehensive test data for ankit_donations table
-- First, get the ankit streamer_id
DO $$
DECLARE
    ankit_streamer_id uuid;
BEGIN
    -- Get ankit's streamer ID
    SELECT id INTO ankit_streamer_id FROM public.streamers WHERE streamer_slug = 'ankit';
    
    -- Insert diverse donation test data
    INSERT INTO public.ankit_donations (
        id, name, amount, message, streamer_id, payment_status, moderation_status, 
        is_hyperemote, message_visible, voice_message_url, approved_by, approved_at, created_at
    ) VALUES 
    -- Recent successful hyperemote donations (auto-approved)
    (gen_random_uuid(), 'Rahul Kumar', 100, 'Amazing stream! Keep it up! 🔥', ankit_streamer_id, 'success', 'auto_approved', true, true, null, 'system', now(), now() - interval '5 minutes'),
    (gen_random_uuid(), 'Priya Sharma', 75, 'Love your content Ankit bhai!', ankit_streamer_id, 'success', 'auto_approved', true, true, null, 'system', now(), now() - interval '15 minutes'),
    (gen_random_uuid(), 'Dev Patel', 150, 'First time donating, you deserve it!', ankit_streamer_id, 'success', 'auto_approved', true, true, null, 'system', now(), now() - interval '1 hour'),
    
    -- Regular donations (approved)
    (gen_random_uuid(), 'Ankita Singh', 25, 'Small support from your biggest fan!', ankit_streamer_id, 'success', 'approved', false, true, null, 'moderator', now(), now() - interval '2 hours'),
    (gen_random_uuid(), 'Rohan Gupta', 30, 'Great explanation of that concept!', ankit_streamer_id, 'success', 'approved', false, true, null, 'moderator', now(), now() - interval '3 hours'),
    (gen_random_uuid(), 'Meera Joshi', 40, 'Thank you for the tutorial series', ankit_streamer_id, 'success', 'approved', false, true, null, 'moderator', now(), now() - interval '4 hours'),
    
    -- Voice message donations
    (gen_random_uuid(), 'Vikram Shah', 85, 'Sent a voice message!', ankit_streamer_id, 'success', 'auto_approved', true, true, 'https://example.com/voice1.mp3', 'system', now(), now() - interval '6 hours'),
    (gen_random_uuid(), 'Neha Kapoor', 60, 'Voice note with appreciation', ankit_streamer_id, 'success', 'auto_approved', true, true, 'https://example.com/voice2.mp3', 'system', now(), now() - interval '8 hours'),
    
    -- Pending moderation (for moderation queue testing)
    (gen_random_uuid(), 'Amit Verma', 35, 'Waiting for approval...', ankit_streamer_id, 'success', 'pending', false, true, null, null, null, now() - interval '30 minutes'),
    (gen_random_uuid(), 'Sanya Malik', 45, 'Hope this gets approved soon!', ankit_streamer_id, 'success', 'pending', false, true, null, null, null, now() - interval '1 hour'),
    (gen_random_uuid(), 'Karan Singh', 120, 'Big donation pending approval', ankit_streamer_id, 'success', 'pending', true, true, null, null, null, now() - interval '2 hours'),
    
    -- Failed payments (for testing)
    (gen_random_uuid(), 'Failed User', 25, 'Payment failed', ankit_streamer_id, 'failed', 'pending', false, false, null, null, null, now() - interval '1 hour'),
    
    -- Older donations for revenue tracking (yesterday)
    (gen_random_uuid(), 'Arjun Reddy', 200, 'Yesterday big donation!', ankit_streamer_id, 'success', 'auto_approved', true, true, null, 'system', now() - interval '1 day', now() - interval '1 day'),
    (gen_random_uuid(), 'Ravi Kumar', 50, 'Regular yesterday donation', ankit_streamer_id, 'success', 'approved', true, true, null, 'moderator', now() - interval '1 day', now() - interval '1 day'),
    (gen_random_uuid(), 'Pooja Agarwal', 75, 'Another yesterday donation', ankit_streamer_id, 'success', 'auto_approved', true, true, null, 'system', now() - interval '1 day', now() - interval '1 day + 2 hours'),
    
    -- Week old donations for chart testing
    (gen_random_uuid(), 'Suresh Nair', 300, 'Week old big support!', ankit_streamer_id, 'success', 'auto_approved', true, true, null, 'system', now() - interval '7 days', now() - interval '7 days'),
    (gen_random_uuid(), 'Kavya Iyer', 90, 'Week old donation', ankit_streamer_id, 'success', 'auto_approved', true, true, null, 'system', now() - interval '7 days', now() - interval '7 days + 3 hours'),
    (gen_random_uuid(), 'Deepak Yadav', 65, 'Another week old', ankit_streamer_id, 'success', 'approved', true, true, null, 'moderator', now() - interval '7 days', now() - interval '7 days + 5 hours'),
    
    -- Month old for 30-day chart
    (gen_random_uuid(), 'Rajesh Khanna', 180, 'Month old big donation', ankit_streamer_id, 'success', 'auto_approved', true, true, null, 'system', now() - interval '30 days', now() - interval '30 days'),
    (gen_random_uuid(), 'Shreya Ghosh', 55, 'Month old regular', ankit_streamer_id, 'success', 'approved', true, true, null, 'moderator', now() - interval '30 days', now() - interval '30 days + 1 hour'),
    
    -- No message donations
    (gen_random_uuid(), 'Anonymous Donor', 15, null, ankit_streamer_id, 'success', 'approved', false, true, null, 'moderator', now(), now() - interval '45 minutes'),
    (gen_random_uuid(), 'Silent Supporter', 80, null, ankit_streamer_id, 'success', 'auto_approved', true, true, null, 'system', now(), now() - interval '2 hours');
    
END $$;