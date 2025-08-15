-- Enhanced database schema for Streamer Donation Dashboard

-- First, enhance the existing chia_gaming_donations table to support streamers
ALTER TABLE public.chia_gaming_donations 
ADD COLUMN IF NOT EXISTS streamer_id UUID,
ADD COLUMN IF NOT EXISTS message_visible BOOLEAN DEFAULT true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chia_gaming_donations_streamer_id ON public.chia_gaming_donations(streamer_id);
CREATE INDEX IF NOT EXISTS idx_chia_gaming_donations_created_at ON public.chia_gaming_donations(created_at DESC);

-- Enhance profiles table for streamer functionality
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS obs_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_streamer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create unique index for OBS tokens
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_obs_token ON public.profiles(obs_token) WHERE obs_token IS NOT NULL;

-- Create function to generate secure OBS tokens
CREATE OR REPLACE FUNCTION public.generate_obs_token()
RETURNS TEXT AS $$
DECLARE
    new_token TEXT;
    token_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a secure 48-character token
        new_token := encode(gen_random_bytes(36), 'base64');
        new_token := replace(replace(replace(new_token, '+', ''), '/', ''), '=', '');
        new_token := substring(new_token from 1 for 48);
        
        -- Check if token already exists
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE obs_token = new_token) INTO token_exists;
        
        -- If token doesn't exist, we can use it
        IF NOT token_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to initialize streamer profile
CREATE OR REPLACE FUNCTION public.initialize_streamer_profile(user_id UUID, user_email TEXT, user_display_name TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        is_streamer = true,
        email = user_email,
        display_name = user_display_name,
        obs_token = public.generate_obs_token(),
        updated_at = now()
    WHERE id = user_id;
    
    -- If profile doesn't exist, create it
    IF NOT FOUND THEN
        INSERT INTO public.profiles (id, is_streamer, email, display_name, obs_token)
        VALUES (user_id, true, user_email, user_display_name, public.generate_obs_token());
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for chia_gaming_donations
DROP POLICY IF EXISTS "Streamers can view their own donations" ON public.chia_gaming_donations;
CREATE POLICY "Streamers can view their own donations" 
ON public.chia_gaming_donations 
FOR SELECT 
USING (auth.uid() = streamer_id);

DROP POLICY IF EXISTS "Streamers can update their own donations" ON public.chia_gaming_donations;
CREATE POLICY "Streamers can update their own donations" 
ON public.chia_gaming_donations 
FOR UPDATE 
USING (auth.uid() = streamer_id);

-- Policy for OBS alerts (public access via token verification)
DROP POLICY IF EXISTS "OBS alerts can view donations by token" ON public.chia_gaming_donations;
CREATE POLICY "OBS alerts can view donations by token" 
ON public.chia_gaming_donations 
FOR SELECT 
USING (
    streamer_id IN (
        SELECT id FROM public.profiles 
        WHERE obs_token = current_setting('request.headers')::json->>'obs-token'
    )
);

-- Set up realtime for donations table
ALTER TABLE public.chia_gaming_donations REPLICA IDENTITY FULL;

-- Add the table to realtime publication
DO $$
BEGIN
    -- Check if publication exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add table to publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chia_gaming_donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;