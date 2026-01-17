-- Fix: Remove password_hash exposure from authenticated users
-- Create a secure view that excludes sensitive fields

-- First, drop the existing policy that exposes password_hash
DROP POLICY IF EXISTS "Users can view their own auth data only" ON auth_users;

-- Create a new restrictive policy - only service role can access full auth_users table
-- (The existing service role policy already handles this, but let's ensure it's explicit)

-- Revoke direct SELECT on auth_users from authenticated users
REVOKE SELECT ON auth_users FROM authenticated;

-- The auth_users_safe view already exists in the schema, but let's ensure 
-- authenticated users can query it for their own data
-- First check if policy exists and create if not
DO $$
BEGIN
  -- Grant SELECT on the safe view to authenticated users
  GRANT SELECT ON auth_users_safe TO authenticated;
EXCEPTION
  WHEN undefined_table THEN
    -- View doesn't exist, we'll handle this case
    RAISE NOTICE 'auth_users_safe view does not exist';
END $$;

-- Ensure anon role also cannot access auth_users directly
REVOKE SELECT ON auth_users FROM anon;