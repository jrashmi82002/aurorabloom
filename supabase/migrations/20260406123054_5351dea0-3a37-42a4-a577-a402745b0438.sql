
-- 1. Fix profiles UPDATE policy: restrict to safe columns only
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a trigger to prevent users from modifying sensitive fields
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the current user is not using service_role, block sensitive field changes
  IF current_setting('request.jwt.claims', true)::jsonb ->> 'role' != 'service_role' THEN
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

-- Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS protect_sensitive_profile_fields ON public.profiles;
CREATE TRIGGER protect_sensitive_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_sensitive_profile_fields();

-- 2. Add DELETE policy for therapy_messages (session owners can delete their messages)
CREATE POLICY "Users can delete messages from their sessions"
  ON public.therapy_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapy_sessions
      WHERE therapy_sessions.id = therapy_messages.session_id
        AND therapy_sessions.user_id = auth.uid()
    )
  );
