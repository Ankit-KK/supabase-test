-- Grant SELECT permission on looteriya_gaming_donations to anon role
-- This allows RLS policies to work for OBS alerts, goal overlay, and leaderboard
GRANT SELECT ON public.looteriya_gaming_donations TO anon;
GRANT SELECT ON public.looteriya_gaming_donations TO authenticated;

-- Create RLS policy for public read of approved donations (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'looteriya_gaming_donations' 
    AND policyname = 'Anyone can view approved donations'
  ) THEN
    CREATE POLICY "Anyone can view approved donations" 
    ON public.looteriya_gaming_donations 
    FOR SELECT 
    USING (
      payment_status = 'success' 
      AND moderation_status IN ('approved', 'auto_approved')
    );
  END IF;
END $$;

-- Create policy for inserting donations (for the donation page)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'looteriya_gaming_donations' 
    AND policyname = 'Anyone can create donations'
  ) THEN
    CREATE POLICY "Anyone can create donations" 
    ON public.looteriya_gaming_donations 
    FOR INSERT 
    WITH CHECK (true);
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.looteriya_gaming_donations ENABLE ROW LEVEL SECURITY;