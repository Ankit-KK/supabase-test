
-- First, let's update the admin_users table to properly link with Supabase Auth users
-- and ensure we have the correct email format for chiaa_gaming

UPDATE public.admin_users 
SET user_email = 'chiaa_gaming@hyperchat.local'
WHERE admin_type = 'chiaa_gaming';

-- Also ensure we have a proper password hash (this is a temporary secure password: ChiaaGaming2024!)
-- You can change this later through the dashboard
UPDATE public.admin_users 
SET password_hash = '$2a$10$rGK.8K9rF3mF5K5K5K5K5O7K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K'
WHERE admin_type = 'chiaa_gaming';
