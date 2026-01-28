-- Add username column to profiles table with unique constraint
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Create function to generate unique username suggestions
CREATE OR REPLACE FUNCTION public.generate_username_suggestion(base_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  suggested_username text;
  counter integer := 0;
BEGIN
  -- Clean the base name (remove spaces, lowercase, keep alphanumeric)
  suggested_username := lower(regexp_replace(base_name, '[^a-zA-Z0-9]', '', 'g'));
  
  -- If empty, use default
  IF suggested_username = '' THEN
    suggested_username := 'user';
  END IF;
  
  -- Check if username exists, if so add random numbers
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = suggested_username) LOOP
    counter := counter + 1;
    suggested_username := lower(regexp_replace(base_name, '[^a-zA-Z0-9]', '', 'g')) || floor(random() * 9000 + 1000)::text;
    
    -- Safety exit after 10 attempts
    IF counter > 10 THEN
      suggested_username := 'user' || floor(random() * 900000 + 100000)::text;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN suggested_username;
END;
$$;

-- Create function to find user by username for login
CREATE OR REPLACE FUNCTION public.get_user_email_by_username(username_param text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT au.email
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE lower(p.username) = lower(username_param)
  LIMIT 1;
$$;