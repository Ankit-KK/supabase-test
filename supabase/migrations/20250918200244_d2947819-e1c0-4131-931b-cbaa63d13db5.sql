-- Create custom authentication table
CREATE TABLE public.auth_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  username TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('streamer', 'admin', 'user')),
  streamer_id UUID REFERENCES public.streamers(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

-- Create policies for auth_users
CREATE POLICY "Users can view their own auth data" 
ON public.auth_users 
FOR SELECT 
USING (id = auth.uid()::uuid);

CREATE POLICY "Service role can manage auth users" 
ON public.auth_users 
FOR ALL 
USING (current_setting('role') = 'service_role');

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION public.verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate secure session tokens
CREATE OR REPLACE FUNCTION public.generate_session_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sessions table for custom auth
CREATE TABLE public.auth_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.auth_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sessions
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" 
ON public.auth_sessions 
FOR SELECT 
USING (user_id IN (SELECT id FROM public.auth_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Service role can manage sessions" 
ON public.auth_sessions 
FOR ALL 
USING (current_setting('role') = 'service_role');