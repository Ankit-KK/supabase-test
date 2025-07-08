-- Add mod_password field to admin_users table for moderator access
ALTER TABLE public.admin_users 
ADD COLUMN mod_password TEXT DEFAULT 'mod123';

-- Update existing chiaa_gaming admin user with a mod password
UPDATE public.admin_users 
SET mod_password = 'mod123'
WHERE admin_type = 'chiaa_gaming';