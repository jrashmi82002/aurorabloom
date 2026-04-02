
-- Remove sensitive tables from realtime publication
-- First check if they exist in the publication, use DO block
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.diary_entries;
  EXCEPTION WHEN OTHERS THEN
    -- Table may not be in the publication, ignore
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;
