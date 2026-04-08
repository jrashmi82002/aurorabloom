
-- The critical security trigger
DROP TRIGGER IF EXISTS protect_sensitive_profile_fields_trigger ON public.profiles;
CREATE TRIGGER protect_sensitive_profile_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_sensitive_profile_fields();

-- Re-create other missing triggers safely
DROP TRIGGER IF EXISTS increment_message_count_trigger ON public.therapy_messages;
CREATE TRIGGER increment_message_count_trigger
  AFTER INSERT ON public.therapy_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_message_count();

DROP TRIGGER IF EXISTS increment_session_count_trigger ON public.therapy_sessions;
CREATE TRIGGER increment_session_count_trigger
  AFTER INSERT ON public.therapy_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_session_count();

DROP TRIGGER IF EXISTS delete_old_notifications_trigger ON public.notifications;
CREATE TRIGGER delete_old_notifications_trigger
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_old_notifications();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
