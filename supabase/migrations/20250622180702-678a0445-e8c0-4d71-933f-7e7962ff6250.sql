
-- First, let's see what the current constraint allows
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'streamer_type_check';

-- Update the check constraint to include all valid streamer types from the streamer configs
ALTER TABLE public.streamer_contracts 
DROP CONSTRAINT IF EXISTS streamer_type_check;

-- Add the updated constraint with all valid streamer types
ALTER TABLE public.streamer_contracts 
ADD CONSTRAINT streamer_type_check 
CHECK (streamer_type IN ('ankit', 'harish', 'mackle', 'rakazone', 'chiaa_gaming'));
