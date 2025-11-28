-- Ensure RLS is enabled on auth_users table
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with more explicit security
DROP POLICY IF EXISTS "Users can view their own auth data" ON public.auth_users;
DROP POLICY IF EXISTS "Service role can manage auth users" ON public.auth_users;

-- Explicit deny-all policy for anonymous/public access (most restrictive, evaluated first)
CREATE POLICY "Deny all anonymous access to auth_users"
ON public.auth_users
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Explicit deny-all policy for authenticated users by default
CREATE POLICY "Deny all public authenticated access to auth_users"
ON public.auth_users
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Allow users to view ONLY their own auth data
CREATE POLICY "Users can view their own auth data only"
ON public.auth_users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Service role maintains full access for backend operations
CREATE POLICY "Service role can manage all auth users"
ON public.auth_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.auth_users IS 'Stores user authentication data. Protected by explicit RLS policies - anonymous access denied, authenticated users can only view their own data, service role has full access for backend operations.';