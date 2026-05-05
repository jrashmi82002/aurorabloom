import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

/**
 * Auth service — thin wrapper around supabase.auth so components/hooks
 * never call supabase.auth.* directly. Centralizes JWT/session handling.
 */
export const authService = {
  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  },

  async getUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  },

  onAuthStateChange(cb: (session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      cb(session);
    });
    return () => data.subscription.unsubscribe();
  },

  async signInWithPassword(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: metadata,
      },
    });
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  /**
   * Returns a fresh access token (refreshing if needed) — for any
   * non-supabase-client fetch that needs to authenticate.
   */
  async getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
};
