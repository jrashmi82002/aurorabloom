-- ============================================
-- 1. LOCK DOWN user_roles - prevent self-escalation
-- ============================================

-- Drop existing insert/update policies and rebuild
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Only admins can insert OR delete roles
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Hard guard: trigger rejects any non-admin attempt to grant admin role
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role full control (for migrations / edge functions using service key)
  IF COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block anyone from assigning a role to themselves
  IF NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot assign roles to themselves';
  END IF;

  -- Only existing admins may insert any role
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can manage roles';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_self_escalation_trigger ON public.user_roles;
CREATE TRIGGER prevent_role_self_escalation_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();

-- ============================================
-- 2. ATTACH profile protection trigger (was defined but not attached)
-- ============================================
DROP TRIGGER IF EXISTS protect_profile_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_sensitive_profile_fields();

-- ============================================
-- 3. LOCK PRIOR MONTH sessions and messages
-- ============================================
CREATE OR REPLACE FUNCTION public.is_current_month(_ts timestamp with time zone)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT date_trunc('month', _ts) = date_trunc('month', now());
$$;

-- Replace UPDATE policy on sessions
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.therapy_sessions;
CREATE POLICY "Users can update their own current month sessions"
  ON public.therapy_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND public.is_current_month(started_at));

-- Replace DELETE policy on sessions (allow deleting any old session if user wants to clean)
-- Keep delete allowed (user-driven cleanup is fine), only block edits

-- Block message inserts to prior-month sessions
DROP POLICY IF EXISTS "Users can insert messages to their sessions" ON public.therapy_messages;
CREATE POLICY "Users can insert messages to current month sessions"
  ON public.therapy_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.therapy_sessions s
      WHERE s.id = therapy_messages.session_id
        AND s.user_id = auth.uid()
        AND public.is_current_month(s.started_at)
    )
  );

-- Block message deletes from prior months
DROP POLICY IF EXISTS "Users can delete messages from their sessions" ON public.therapy_messages;
CREATE POLICY "Users can delete messages from current month sessions"
  ON public.therapy_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.therapy_sessions s
      WHERE s.id = therapy_messages.session_id
        AND s.user_id = auth.uid()
        AND public.is_current_month(s.started_at)
    )
  );

-- ============================================
-- 4. MONTHLY METRICS table for unique report comparisons
-- ============================================
CREATE TABLE IF NOT EXISTS public.monthly_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month_start date NOT NULL,
  message_count integer DEFAULT 0,
  session_count integer DEFAULT 0,
  dominant_themes text[] DEFAULT ARRAY[]::text[],
  avg_mood_score numeric(4,2),
  growth_summary text,
  previous_report_excerpt text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, month_start)
);

ALTER TABLE public.monthly_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own metrics"
  ON public.monthly_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own metrics"
  ON public.monthly_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own metrics"
  ON public.monthly_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER monthly_metrics_updated_at
  BEFORE UPDATE ON public.monthly_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_monthly_metrics_user_month
  ON public.monthly_metrics(user_id, month_start DESC);