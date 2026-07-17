
-- Persona cache (stale-while-revalidate)
CREATE TABLE public.persona_cache (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_text text NOT NULL,
  input_hash text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.persona_cache TO authenticated;
GRANT ALL ON public.persona_cache TO service_role;
ALTER TABLE public.persona_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own persona cache read" ON public.persona_cache FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own persona cache write" ON public.persona_cache FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own persona cache update" ON public.persona_cache FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER persona_cache_updated_at BEFORE UPDATE ON public.persona_cache FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Rolling summary + archival flags for scale
ALTER TABLE public.therapy_sessions
  ADD COLUMN IF NOT EXISTS rolling_summary text,
  ADD COLUMN IF NOT EXISTS summary_up_to_message_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.therapy_messages
  ADD COLUMN IF NOT EXISTS safety_level text CHECK (safety_level IN ('info','caution','critical'));

CREATE INDEX IF NOT EXISTS therapy_messages_session_created_idx
  ON public.therapy_messages (session_id, created_at);

CREATE INDEX IF NOT EXISTS therapy_sessions_user_started_idx
  ON public.therapy_sessions (user_id, started_at DESC);
