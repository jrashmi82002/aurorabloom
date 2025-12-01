-- Add demographic and subscription fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age_group TEXT CHECK (age_group IN ('children', 'genz', 'millennial', 'older')),
ADD COLUMN IF NOT EXISTS gender_identity TEXT,
ADD COLUMN IF NOT EXISTS pro_subscription_status TEXT DEFAULT 'free' CHECK (pro_subscription_status IN ('free', 'monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS pro_subscription_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS daily_message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add quiz responses table
CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.therapy_sessions(id) ON DELETE CASCADE,
  age_group TEXT,
  gender_identity TEXT,
  current_mood_scales JSONB,
  therapy_goals TEXT[],
  previous_experience TEXT,
  custom_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on quiz_responses
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for quiz_responses
CREATE POLICY "Users can insert their quiz responses"
ON public.quiz_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their quiz responses"
ON public.quiz_responses FOR SELECT
USING (auth.uid() = user_id);

-- Add demographic-specific therapy types to enum
ALTER TYPE therapy_type ADD VALUE IF NOT EXISTS 'genz_therapy';
ALTER TYPE therapy_type ADD VALUE IF NOT EXISTS 'female_therapy';
ALTER TYPE therapy_type ADD VALUE IF NOT EXISTS 'male_therapy';
ALTER TYPE therapy_type ADD VALUE IF NOT EXISTS 'older_therapy';
ALTER TYPE therapy_type ADD VALUE IF NOT EXISTS 'children_therapy';
ALTER TYPE therapy_type ADD VALUE IF NOT EXISTS 'millennial_therapy';
ALTER TYPE therapy_type ADD VALUE IF NOT EXISTS 'advanced_therapy';

-- Add fields to therapy_sessions for quiz and visuals
ALTER TABLE public.therapy_sessions
ADD COLUMN IF NOT EXISTS has_quiz_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

-- Function to reset daily message count
CREATE OR REPLACE FUNCTION reset_daily_message_count()
RETURNS trigger AS $$
BEGIN
  IF NEW.last_message_date < CURRENT_DATE THEN
    NEW.daily_message_count := 0;
    NEW.last_message_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to reset daily count
CREATE TRIGGER reset_daily_count_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (NEW.daily_message_count IS DISTINCT FROM OLD.daily_message_count)
EXECUTE FUNCTION reset_daily_message_count();

-- Function to check if user can send message
CREATE OR REPLACE FUNCTION can_user_send_message(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT 
    pro_subscription_status,
    daily_message_count,
    last_message_date,
    pro_subscription_ends_at
  INTO profile_record
  FROM public.profiles
  WHERE id = user_id_param;

  -- Check if pro subscription is active
  IF profile_record.pro_subscription_status IN ('monthly', 'yearly') AND 
     profile_record.pro_subscription_ends_at > now() THEN
    RETURN true;
  END IF;

  -- Check if daily limit reached for free users
  IF profile_record.last_message_date < CURRENT_DATE THEN
    RETURN true; -- New day, reset count
  END IF;

  RETURN profile_record.daily_message_count < 200;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update profiles table trigger to increment message count
CREATE OR REPLACE FUNCTION increment_message_count()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET 
    daily_message_count = CASE 
      WHEN last_message_date < CURRENT_DATE THEN 1
      ELSE daily_message_count + 1
    END,
    last_message_date = CURRENT_DATE
  WHERE id = (SELECT user_id FROM therapy_sessions WHERE id = NEW.session_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment count on new message
CREATE TRIGGER increment_count_trigger
AFTER INSERT ON public.therapy_messages
FOR EACH ROW
WHEN (NEW.role = 'user')
EXECUTE FUNCTION increment_message_count();