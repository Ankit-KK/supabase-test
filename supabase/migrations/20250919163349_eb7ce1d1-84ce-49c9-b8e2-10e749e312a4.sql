-- Drop the old foreign key constraint that references auth.users
ALTER TABLE public.streamers 
DROP CONSTRAINT streamers_user_id_fkey;

-- Add new foreign key constraint that references the custom auth_users table
ALTER TABLE public.streamers 
ADD CONSTRAINT streamers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE SET NULL;

-- Now link ankit streamer to the correct user
UPDATE public.streamers 
SET user_id = '88f92748-3245-4cea-b0c9-a8cd568dda56' 
WHERE streamer_slug = 'ankit';