CREATE OR REPLACE FUNCTION public.acquire_job_lease(_name text, _minutes integer DEFAULT 3)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  got boolean := false;
BEGIN
  UPDATE public.job_state
  SET locked_until = now() + make_interval(mins => _minutes),
      updated_at = now()
  WHERE name = _name
    AND (locked_until IS NULL OR locked_until < now())
  RETURNING true INTO got;

  RETURN COALESCE(got, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_job_lease(_name text, _paused_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.job_state
  SET locked_until = NULL,
      paused_reason = _paused_reason,
      paused_at = CASE WHEN _paused_reason IS NULL THEN NULL ELSE now() END,
      updated_at = now()
  WHERE name = _name;
END;
$$;

REVOKE ALL ON FUNCTION public.acquire_job_lease(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_job_lease(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_job_lease(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_job_lease(text, text) TO service_role;