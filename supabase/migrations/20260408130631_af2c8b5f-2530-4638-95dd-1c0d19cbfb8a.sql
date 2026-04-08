CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') <> 'service_role' THEN
    NEW.pro_subscription_status := OLD.pro_subscription_status;
    NEW.pro_subscription_ends_at := OLD.pro_subscription_ends_at;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    NEW.daily_message_count := OLD.daily_message_count;
    NEW.daily_session_count := OLD.daily_session_count;
    NEW.last_message_date := OLD.last_message_date;
    NEW.last_session_date := OLD.last_session_date;
    NEW.session_cooldown_until := OLD.session_cooldown_until;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_update_own_profile(
  _profile_id uuid,
  _pro_subscription_status text,
  _pro_subscription_ends_at timestamp with time zone,
  _stripe_customer_id text,
  _stripe_subscription_id text,
  _daily_message_count integer,
  _daily_session_count integer,
  _last_message_date date,
  _last_session_date date,
  _session_cooldown_until timestamp with time zone
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  existing_profile public.profiles%ROWTYPE;
BEGIN
  SELECT *
  INTO existing_profile
  FROM public.profiles
  WHERE id = _profile_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN existing_profile.pro_subscription_status IS NOT DISTINCT FROM _pro_subscription_status
    AND existing_profile.pro_subscription_ends_at IS NOT DISTINCT FROM _pro_subscription_ends_at
    AND existing_profile.stripe_customer_id IS NOT DISTINCT FROM _stripe_customer_id
    AND existing_profile.stripe_subscription_id IS NOT DISTINCT FROM _stripe_subscription_id
    AND existing_profile.daily_message_count IS NOT DISTINCT FROM _daily_message_count
    AND existing_profile.daily_session_count IS NOT DISTINCT FROM _daily_session_count
    AND existing_profile.last_message_date IS NOT DISTINCT FROM _last_message_date
    AND existing_profile.last_session_date IS NOT DISTINCT FROM _last_session_date
    AND existing_profile.session_cooldown_until IS NOT DISTINCT FROM _session_cooldown_until;
END;
$$;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND public.can_update_own_profile(
    id,
    pro_subscription_status,
    pro_subscription_ends_at,
    stripe_customer_id,
    stripe_subscription_id,
    daily_message_count,
    daily_session_count,
    last_message_date,
    last_session_date,
    session_cooldown_until
  )
);

DROP TRIGGER IF EXISTS protect_sensitive_profile_fields_trigger ON public.profiles;
CREATE TRIGGER protect_sensitive_profile_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_sensitive_profile_fields();

DROP POLICY IF EXISTS "Authenticated users insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));