-- Create diary_entries table for persistent diary storage
CREATE TABLE public.diary_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL,
  content TEXT NOT NULL,
  insight TEXT,
  image_url TEXT,
  theme TEXT DEFAULT 'default',
  mood_sticker TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

-- Enable RLS on diary_entries
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for diary_entries
CREATE POLICY "Users can view their own diary entries"
ON public.diary_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diary entries"
ON public.diary_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diary entries"
ON public.diary_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diary entries"
ON public.diary_entries FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_diary_entries_updated_at
BEFORE UPDATE ON public.diary_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add session_count to profiles for tracking daily sessions (free users: 3 sessions limit)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_session_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_session_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS session_cooldown_until TIMESTAMP WITH TIME ZONE;

-- Create storage bucket for diary images
INSERT INTO storage.buckets (id, name, public) VALUES ('diary-images', 'diary-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for diary images
CREATE POLICY "Users can view their own diary images"
ON storage.objects FOR SELECT
USING (bucket_id = 'diary-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own diary images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'diary-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own diary images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'diary-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own diary images"
ON storage.objects FOR DELETE
USING (bucket_id = 'diary-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for diary_entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.diary_entries;

-- Function to auto-delete old notifications (older than 7 days)
CREATE OR REPLACE FUNCTION public.delete_old_notifications()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '7 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to clean up old notifications when new ones are inserted
CREATE TRIGGER cleanup_old_notifications
AFTER INSERT ON public.notifications
FOR EACH STATEMENT
EXECUTE FUNCTION public.delete_old_notifications();

-- Function to check if user can start a new session (3 sessions for free, unlimited for pro)
CREATE OR REPLACE FUNCTION public.can_user_start_session(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  profile_record RECORD;
  result JSONB;
BEGIN
  SELECT 
    pro_subscription_status,
    daily_session_count,
    last_session_date,
    session_cooldown_until,
    pro_subscription_ends_at
  INTO profile_record
  FROM public.profiles
  WHERE id = user_id_param;

  -- Pro users have unlimited access
  IF profile_record.pro_subscription_status IN ('monthly', 'yearly') AND 
     (profile_record.pro_subscription_ends_at IS NULL OR profile_record.pro_subscription_ends_at > now()) THEN
    RETURN jsonb_build_object('allowed', true, 'is_pro', true);
  END IF;

  -- Check cooldown period
  IF profile_record.session_cooldown_until IS NOT NULL AND profile_record.session_cooldown_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'is_pro', false, 
      'reason', 'cooldown',
      'cooldown_until', profile_record.session_cooldown_until
    );
  END IF;

  -- Reset count if it's a new day
  IF profile_record.last_session_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('allowed', true, 'is_pro', false, 'sessions_remaining', 3);
  END IF;

  -- Check session limit (3 sessions per day for free users)
  IF profile_record.daily_session_count >= 3 THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'is_pro', false, 
      'reason', 'limit_reached',
      'sessions_used', profile_record.daily_session_count
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true, 
    'is_pro', false, 
    'sessions_remaining', 3 - COALESCE(profile_record.daily_session_count, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to increment session count and set cooldown when limit reached
CREATE OR REPLACE FUNCTION public.increment_session_count()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Get current count and update
  UPDATE public.profiles
  SET 
    daily_session_count = CASE 
      WHEN last_session_date < CURRENT_DATE THEN 1
      ELSE daily_session_count + 1
    END,
    last_session_date = CURRENT_DATE,
    session_cooldown_until = CASE 
      WHEN last_session_date = CURRENT_DATE AND daily_session_count >= 2 THEN NOW() + INTERVAL '6 hours'
      ELSE session_cooldown_until
    END
  WHERE id = NEW.user_id
  RETURNING daily_session_count INTO current_count;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to increment session count when a new session is created
CREATE TRIGGER increment_session_on_create
AFTER INSERT ON public.therapy_sessions
FOR EACH ROW
EXECUTE FUNCTION public.increment_session_count();

-- Allow users to delete their own profile (for account deletion)
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = id);