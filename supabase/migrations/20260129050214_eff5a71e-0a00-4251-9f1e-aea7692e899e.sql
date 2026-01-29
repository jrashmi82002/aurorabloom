-- Fix 1: Make diary-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'diary-images';

-- Fix 2: Secure username_email_lookup function with input validation
-- This function is used for login, so it should remain callable but with proper validation
CREATE OR REPLACE FUNCTION public.get_user_email_by_username(username_param text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_email text;
BEGIN
  -- Input validation: check length and format
  IF username_param IS NULL OR length(username_param) < 3 OR length(username_param) > 30 THEN
    RETURN NULL;
  END IF;
  
  -- Only allow alphanumeric and underscore characters
  IF username_param !~ '^[a-zA-Z0-9_]+$' THEN
    RETURN NULL;
  END IF;
  
  -- Perform lookup with case-insensitive comparison
  SELECT au.email INTO result_email
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE lower(p.username) = lower(username_param)
  LIMIT 1;
  
  RETURN result_email;
END;
$$;