-- First, clear the invalid user_id from ankit streamer
UPDATE public.streamers 
SET user_id = NULL 
WHERE streamer_slug = 'ankit';

-- Drop the old foreign key constraint that references auth.users
ALTER TABLE public.streamers 
DROP CONSTRAINT streamers_user_id_fkey;

-- Add new foreign key constraint that references the custom auth_users table
ALTER TABLE public.streamers 
ADD CONSTRAINT streamers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE SET NULL;

-- Now link ankit streamer to the correct user from auth_users table
UPDATE public.streamers 
SET user_id = (SELECT id FROM public.auth_users WHERE email = 'ankit@example.com')
WHERE streamer_slug = 'ankit';