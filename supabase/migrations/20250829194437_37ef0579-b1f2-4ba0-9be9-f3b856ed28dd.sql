-- Add Instagram field to user signups table
ALTER TABLE public.user_signups 
ADD COLUMN instagram_handle text;