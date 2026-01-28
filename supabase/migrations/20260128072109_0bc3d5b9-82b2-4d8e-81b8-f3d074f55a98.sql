-- Add missing DELETE policy for therapy_sessions table
-- This allows users to delete their own therapy sessions
CREATE POLICY "Users can delete their own sessions"
  ON public.therapy_sessions
  FOR DELETE
  USING (auth.uid() = user_id);