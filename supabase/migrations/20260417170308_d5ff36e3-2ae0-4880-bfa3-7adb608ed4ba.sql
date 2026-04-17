CREATE OR REPLACE FUNCTION public.is_current_month(_ts timestamp with time zone)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT date_trunc('month', _ts) = date_trunc('month', now());
$$;