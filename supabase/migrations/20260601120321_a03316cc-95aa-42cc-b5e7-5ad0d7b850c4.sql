CREATE TABLE public.yoga_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  level TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.yoga_queries TO authenticated;
GRANT ALL ON public.yoga_queries TO service_role;

ALTER TABLE public.yoga_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit their own yoga queries"
ON public.yoga_queries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own yoga queries"
ON public.yoga_queries FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all yoga queries"
ON public.yoga_queries FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update yoga queries"
ON public.yoga_queries FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete yoga queries"
ON public.yoga_queries FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_yoga_queries_updated_at
BEFORE UPDATE ON public.yoga_queries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();