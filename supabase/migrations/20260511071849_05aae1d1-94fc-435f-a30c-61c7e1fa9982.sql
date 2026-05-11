
-- 1. Explicit deny UPDATE on therapy_messages
DROP POLICY IF EXISTS "No one can update therapy messages" ON public.therapy_messages;
CREATE POLICY "No one can update therapy messages"
ON public.therapy_messages
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- 2. Harden can_user_start_session: only allow self-lookup
CREATE OR REPLACE FUNCTION public.can_user_start_session(user_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  profile_record RECORD;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> user_id_param THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthorized');
  END IF;

  SELECT 
    pro_subscription_status,
    daily_session_count,
    last_session_date,
    session_cooldown_until,
    pro_subscription_ends_at
  INTO profile_record
  FROM public.profiles
  WHERE id = user_id_param;

  IF profile_record.pro_subscription_status IN ('monthly', 'yearly') AND 
     (profile_record.pro_subscription_ends_at IS NULL OR profile_record.pro_subscription_ends_at > now()) THEN
    RETURN jsonb_build_object('allowed', true, 'is_pro', true);
  END IF;

  IF profile_record.session_cooldown_until IS NOT NULL AND profile_record.session_cooldown_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'is_pro', false, 
      'reason', 'cooldown',
      'cooldown_until', profile_record.session_cooldown_until
    );
  END IF;

  IF profile_record.last_session_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('allowed', true, 'is_pro', false, 'sessions_remaining', 3);
  END IF;

  IF profile_record.daily_session_count >= 3 THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'is_pro', false, 
      'reason', 'limit_reached',
      'sessions_used', profile_record.daily_session_count
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true, 
    'is_pro', false, 
    'sessions_remaining', 3 - COALESCE(profile_record.daily_session_count, 0)
  );
END;
$function$;

-- 3. Harden can_user_send_message
CREATE OR REPLACE FUNCTION public.can_user_send_message(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  profile_record RECORD;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> user_id_param THEN
    RETURN false;
  END IF;

  SELECT 
    pro_subscription_status,
    daily_message_count,
    last_message_date,
    pro_subscription_ends_at
  INTO profile_record
  FROM public.profiles
  WHERE id = user_id_param;

  IF profile_record.pro_subscription_status IN ('monthly', 'yearly') AND 
     profile_record.pro_subscription_ends_at > now() THEN
    RETURN true;
  END IF;

  IF profile_record.last_message_date < CURRENT_DATE THEN
    RETURN true;
  END IF;

  RETURN profile_record.daily_message_count < 200;
END;
$function$;

-- 4. Revoke public/anon access to sensitive RPCs; grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.can_user_start_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_user_start_session(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.can_user_send_message(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_user_send_message(uuid) TO authenticated;

-- 5. get_user_email_by_username — must remain callable by anon for username login,
-- but already validates input format. Keep accessible. (No change.)
