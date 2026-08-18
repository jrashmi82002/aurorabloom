CREATE TABLE public.hot_cache (
  user_id uuid NOT NULL,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  input_hash text,
  computed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  PRIMARY KEY (user_id, kind)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hot_cache TO authenticated;
GRANT ALL ON public.hot_cache TO service_role;
ALTER TABLE public.hot_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own hot cache" ON public.hot_cache
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users write own hot cache" ON public.hot_cache
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own hot cache" ON public.hot_cache
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own hot cache" ON public.hot_cache
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.cache_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE UNIQUE INDEX cache_jobs_one_pending ON public.cache_jobs (user_id, kind) WHERE status = 'pending';
CREATE INDEX cache_jobs_pending_order ON public.cache_jobs (status, created_at);

GRANT SELECT ON public.cache_jobs TO authenticated;
GRANT ALL ON public.cache_jobs TO service_role;
ALTER TABLE public.cache_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cache jobs" ON public.cache_jobs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.job_state (
  name text NOT NULL PRIMARY KEY,
  locked_until timestamptz,
  paused_reason text,
  paused_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.job_state TO service_role;
ALTER TABLE public.job_state ENABLE ROW LEVEL SECURITY;

INSERT INTO public.job_state (name) VALUES ('cache-worker');

CREATE OR REPLACE FUNCTION public.enqueue_cache_job(_kind text, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _kind NOT IN ('persona', 'report', 'profile_stats') THEN
    RAISE EXCEPTION 'Unsupported cache kind: %', _kind;
  END IF;

  INSERT INTO public.cache_jobs (user_id, kind, reason)
  VALUES (auth.uid(), _kind, left(COALESCE(_reason, 'manual'), 120))
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_cache_job(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_cache_job(text, text) TO authenticated;