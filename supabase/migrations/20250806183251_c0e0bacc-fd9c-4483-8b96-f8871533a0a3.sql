-- Fix function search path security issues
-- Update functions to have secure search_path settings

CREATE OR REPLACE FUNCTION public.check_username_exists(username text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE username = username);
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_username_exists(username_to_check text, exclude_user_id uuid)
 RETURNS TABLE(username_exists boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE username = username_to_check
    AND id != exclude_user_id
  );
$function$;