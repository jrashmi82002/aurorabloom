
-- Fix diary_entries policies: drop RESTRICTIVE, recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users can create their own diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can delete their own diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can update their own diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can view their own diary entries" ON public.diary_entries;

CREATE POLICY "Users can create their own diary entries" ON public.diary_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own diary entries" ON public.diary_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own diary entries" ON public.diary_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own diary entries" ON public.diary_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix quiz_responses policies
DROP POLICY IF EXISTS "Users can insert their quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Users can view their quiz responses" ON public.quiz_responses;

CREATE POLICY "Users can insert their quiz responses" ON public.quiz_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their quiz responses" ON public.quiz_responses FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix therapy_sessions policies
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.therapy_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.therapy_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.therapy_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.therapy_sessions;

CREATE POLICY "Users can create their own sessions" ON public.therapy_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON public.therapy_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.therapy_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own sessions" ON public.therapy_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix user_roles policies
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix pro_access_requests policies
DROP POLICY IF EXISTS "Admins can delete pro access requests" ON public.pro_access_requests;
DROP POLICY IF EXISTS "Admins can update pro access requests" ON public.pro_access_requests;
DROP POLICY IF EXISTS "Admins can view all pro access requests" ON public.pro_access_requests;
DROP POLICY IF EXISTS "Users can submit their own pro access requests" ON public.pro_access_requests;
DROP POLICY IF EXISTS "Users can view their own pro access requests" ON public.pro_access_requests;

CREATE POLICY "Admins can delete pro access requests" ON public.pro_access_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update pro access requests" ON public.pro_access_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all pro access requests" ON public.pro_access_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can submit their own pro access requests" ON public.pro_access_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own pro access requests" ON public.pro_access_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix notifications policies
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR (auth.uid() = user_id));
CREATE POLICY "Authenticated users insert own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix profiles policies
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- Fix therapy_messages policies
DROP POLICY IF EXISTS "Users can insert messages to their sessions" ON public.therapy_messages;
DROP POLICY IF EXISTS "Users can view messages from their sessions" ON public.therapy_messages;

CREATE POLICY "Users can insert messages to their sessions" ON public.therapy_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM therapy_sessions WHERE therapy_sessions.id = therapy_messages.session_id AND therapy_sessions.user_id = auth.uid()));
CREATE POLICY "Users can view messages from their sessions" ON public.therapy_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM therapy_sessions WHERE therapy_sessions.id = therapy_messages.session_id AND therapy_sessions.user_id = auth.uid()));
