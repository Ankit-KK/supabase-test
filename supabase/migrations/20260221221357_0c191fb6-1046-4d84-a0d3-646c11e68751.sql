
-- Move extensions from public schema to extensions schema
ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
ALTER EXTENSION "pgcrypto" SET SCHEMA extensions;
