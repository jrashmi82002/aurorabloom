
CREATE TABLE public.paintings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  image_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.paintings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own paintings" ON public.paintings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own paintings" ON public.paintings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own paintings" ON public.paintings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own paintings" ON public.paintings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_paintings_user_created ON public.paintings(user_id, created_at DESC);

CREATE TRIGGER paintings_updated_at
BEFORE UPDATE ON public.paintings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
