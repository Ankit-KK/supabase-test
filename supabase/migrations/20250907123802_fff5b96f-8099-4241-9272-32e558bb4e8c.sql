-- Fix security linter warnings

-- Fix function search path for security functions
CREATE OR REPLACE FUNCTION public.log_obs_token_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all access to OBS tokens for security monitoring
  PERFORM public.log_sensitive_access(
    'obs_tokens',
    TG_OP,
    COALESCE(NEW.id, OLD.id)
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix function search path for auth email logging
CREATE OR REPLACE FUNCTION public.log_auth_email_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all access to auth emails for security monitoring
  PERFORM public.log_sensitive_access(
    'streamers_auth_emails',
    TG_OP,
    COALESCE(NEW.id, OLD.id)
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;