-- Drop overly permissive policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create a more restrictive insert policy - allowing authenticated users to insert only for themselves
-- Edge functions use service role which bypasses RLS anyway
CREATE POLICY "Authenticated users insert own notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);