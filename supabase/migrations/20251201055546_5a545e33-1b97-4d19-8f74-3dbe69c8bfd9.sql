-- Fix security warnings by setting search_path on functions

-- Update reset_daily_message_count function with search_path
CREATE OR REPLACE FUNCTION reset_daily_message_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.last_message_date < CURRENT_DATE THEN
    NEW.daily_message_count := 0;
    NEW.last_message_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

-- Update can_user_send_message function with search_path
CREATE OR REPLACE FUNCTION can_user_send_message(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT 
    pro_subscription_status,
    daily_message_count,
    last_message_date,
    pro_subscription_ends_at
  INTO profile_record
  FROM public.profiles
  WHERE id = user_id_param;

  -- Check if pro subscription is active
  IF profile_record.pro_subscription_status IN ('monthly', 'yearly') AND 
     profile_record.pro_subscription_ends_at > now() THEN
    RETURN true;
  END IF;

  -- Check if daily limit reached for free users
  IF profile_record.last_message_date < CURRENT_DATE THEN
    RETURN true; -- New day, reset count
  END IF;

  RETURN profile_record.daily_message_count < 200;
END;
$$;

-- Update increment_message_count function with search_path
CREATE OR REPLACE FUNCTION increment_message_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    daily_message_count = CASE 
      WHEN last_message_date < CURRENT_DATE THEN 1
      ELSE daily_message_count + 1
    END,
    last_message_date = CURRENT_DATE
  WHERE id = (SELECT user_id FROM therapy_sessions WHERE id = NEW.session_id);
  RETURN NEW;
END;
$$;