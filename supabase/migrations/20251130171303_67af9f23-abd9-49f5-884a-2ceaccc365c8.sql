-- Create enum for therapy types
CREATE TYPE therapy_type AS ENUM (
  'yogic',
  'psychological', 
  'physiotherapy',
  'ayurveda',
  'talk_therapy'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create therapy sessions table
CREATE TABLE public.therapy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  therapy_type therapy_type NOT NULL,
  title TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on therapy_sessions
ALTER TABLE public.therapy_sessions ENABLE ROW LEVEL SECURITY;

-- Therapy sessions policies
CREATE POLICY "Users can view their own sessions"
  ON public.therapy_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.therapy_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.therapy_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create therapy messages table
CREATE TABLE public.therapy_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.therapy_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on therapy_messages
ALTER TABLE public.therapy_messages ENABLE ROW LEVEL SECURITY;

-- Therapy messages policies
CREATE POLICY "Users can view messages from their sessions"
  ON public.therapy_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.therapy_sessions
      WHERE therapy_sessions.id = therapy_messages.session_id
      AND therapy_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their sessions"
  ON public.therapy_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.therapy_sessions
      WHERE therapy_sessions.id = therapy_messages.session_id
      AND therapy_sessions.user_id = auth.uid()
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();