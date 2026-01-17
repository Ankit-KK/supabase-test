-- Fix telegram_callback_mapping security vulnerability
-- Remove the overly permissive policy and restrict to service_role only

-- Drop the permissive policy that allows all operations
DROP POLICY IF EXISTS "Allow all operations for telegram callbacks" ON public.telegram_callback_mapping;

-- Create restrictive policy for service role only
CREATE POLICY "Service role can manage telegram callbacks"
ON public.telegram_callback_mapping
FOR ALL
TO authenticated, anon
USING (current_setting('role', true) = 'service_role')
WITH CHECK (current_setting('role', true) = 'service_role');

-- Add comment explaining the security rationale
COMMENT ON TABLE public.telegram_callback_mapping IS 'Telegram callback mappings. Access restricted to service_role only to prevent manipulation of notification callbacks.';