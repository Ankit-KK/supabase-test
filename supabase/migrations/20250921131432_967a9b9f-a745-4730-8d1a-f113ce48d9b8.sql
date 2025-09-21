-- Check and remove all foreign key constraints on streamers table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'streamers' 
        AND constraint_type = 'FOREIGN KEY'
        AND table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.streamers DROP CONSTRAINT ' || r.constraint_name;
    END LOOP;
END $$;

-- Also remove any constraints on profiles table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_type = 'FOREIGN KEY'
        AND table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || r.constraint_name;
    END LOOP;
END $$;