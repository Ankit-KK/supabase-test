-- Enable Row Level Security on telegram_callback_mapping
ALTER TABLE public.telegram_callback_mapping ENABLE ROW LEVEL SECURITY;

-- Service role can manage all callback mappings (for edge functions)
CREATE POLICY "Service role can manage callback mappings"
ON public.telegram_callback_mapping
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Deny all access to anon and authenticated users (this table is only accessed by edge functions)
-- No additional policies needed - RLS enabled with no public policies = denied by default